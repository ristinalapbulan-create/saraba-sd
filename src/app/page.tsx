"use client";

import Link from "next/link";
import { FaCalendarAlt, FaUsers, FaArrowRight, FaMapMarkerAlt, FaSchool, FaFilter, FaChartLine } from "react-icons/fa";
import { motion, useScroll, useTransform } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const { scrollY } = useScroll();

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalQuota: 0, totalResponses: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsRef = collection(db, "events");
        const snapshot = await getDocs(eventsRef);

        const loadedEvents: any[] = [];
        const yearsSet = new Set<string>();

        const eventPromises = snapshot.docs.map(async (docSnap) => {
          const eventData = docSnap.data();
          const slug = eventData.slug || docSnap.id;
          eventData._dateObj = eventData.date ? new Date(eventData.date) : new Date(0);

          if (eventData.date) {
            yearsSet.add(eventData._dateObj.getFullYear().toString());
          }

          let resCount = 0;
          const insts = new Set();

          try {
            const evalsRef = collection(db, `events/${slug}/evaluations`);
            const evalsSnap = await getDocs(evalsRef);
            resCount = evalsSnap.size;
            evalsSnap.docs.forEach(evDoc => {
              const ev = evDoc.data();
              if (ev.institute) insts.add(ev.institute.trim().toLowerCase());
            });
          } catch (e) {
            console.error(`Error loading evaluations for ${slug}`, e);
          }

          eventData._respondentsCount = resCount;
          eventData._institutes = Array.from(insts);

          return eventData;
        });

        const resolvedEvents = await Promise.all(eventPromises);
        loadedEvents.push(...resolvedEvents);

        loadedEvents.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());

        const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
        setAvailableYears(sortedYears);
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]);
        } else {
          const currentYear = new Date().getFullYear().toString();
          setAvailableYears([currentYear]);
          setSelectedYear(currentYear);
        }

        setAllEvents(loadedEvents.filter(ev => ev.status !== "Draft (Sembunyikan)"));
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (allEvents.length === 0) return;

    const filteredEvents = allEvents.filter((ev: any) => {
      if (!ev.date) return false;
      return ev._dateObj.getFullYear().toString() === selectedYear;
    });

    let quotaSum = 0;
    let categoriesCount: Record<string, number> = {};
    let responsesSum = 0;

    filteredEvents.forEach((ev: any) => {
      const quotaNum = parseInt(ev.quota?.toString() || "0", 10);
      if (!isNaN(quotaNum)) quotaSum += quotaNum;

      const cat = ev.category || "Umum";
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;

      responsesSum += ev._respondentsCount || 0;
    });

    setStats({
      totalEvents: filteredEvents.length,
      totalQuota: quotaSum,
      totalResponses: responsesSum
    });

    setRecentEvents(filteredEvents.slice(0, 4));

    const catsArray = Object.keys(categoriesCount)
      .map((k) => ({ name: k, count: categoriesCount[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const colorsData = [
      { color: "text-blue-500", bgLight: "bg-blue-50", bgBar: "bg-blue-400" },
      { color: "text-indigo-500", bgLight: "bg-indigo-50", bgBar: "bg-indigo-400" },
      { color: "text-violet-500", bgLight: "bg-violet-50", bgBar: "bg-violet-400" },
      { color: "text-pink-500", bgLight: "bg-pink-50", bgBar: "bg-pink-400" }
    ];

    catsArray.forEach((c: any, idx) => {
      Object.assign(c, colorsData[idx % colorsData.length]);
      c.percentage = (filteredEvents.length > 0) ? Math.round((c.count / filteredEvents.length) * 100) + "%" : "0%";
    });

    setCategoryDistribution(catsArray);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const monthCounts = new Array(12).fill(0);

    filteredEvents.forEach((ev: any) => {
      if (ev.date) {
        monthCounts[ev._dateObj.getMonth()]++;
      }
    });

    const newMonthlyData = monthNames.map((name, idx) => ({
      name,
      event: monthCounts[idx]
    }));

    setMonthlyData(newMonthlyData);
  }, [selectedYear, allEvents]);

  // Parallax effects for pastel orbs
  const yBg1 = useTransform(scrollY, [0, 1000], [0, 250]);
  const yBg2 = useTransform(scrollY, [0, 1000], [0, -200]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] relative overflow-hidden text-slate-800 font-sans selection:bg-blue-200">

      {/* --- Light Pastel Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80"></div>

        {/* Floating Pastel Orbs */}
        <motion.div style={{ y: yBg1 }} className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-300/30 rounded-full blur-[100px]" />
        <motion.div style={{ y: yBg2 }} className="absolute top-[30%] right-[-10%] w-[35vw] h-[35vw] bg-pink-300/30 rounded-full blur-[100px]" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[30%] w-[50vw] h-[20vw] bg-teal-300/30 rounded-full blur-[120px]"
        />

        {/* Soft white overlay for liquid glass pop */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[30px]"></div>
      </div>

      {/* --- Minimalist Glass Header --- */}
      <header className="fixed top-4 left-0 right-0 z-50 px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/80 px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-auto"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xl border border-blue-200">
              S
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold tracking-widest text-slate-800 leading-none drop-shadow-sm">
                SARABA SD
              </h1>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Pembinaan SD - Disdikbud Tabalong</span>
            </div>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="pointer-events-auto"
          >
            <Link href="/admin" className="relative group overflow-hidden px-6 py-3 rounded-2xl font-bold text-sm bg-white/70 text-blue-600 border border-white/80 backdrop-blur-xl transition-all hover:bg-blue-50 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <span className="relative z-10">Portal Admin</span>
              <FaArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 space-y-16">

        {/* --- HERO SECTION --- */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto space-y-8 pt-4 lg:pt-8"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/70 border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-blue-600 text-sm font-bold backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_#3b82f640]"></span>
            </span>
            Sistem Aplikasi Rancang Berbagai Acara
          </div>

          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.15] text-slate-800 drop-shadow-sm">
            Eksplorasi Katalog <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 relative inline-block">
              Aktivitas Aktual
              <div className="absolute bottom-1 left-0 w-full h-3 bg-blue-200/50 blur-md"></div>
            </span>
          </h2>

          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Pantau daftar partisipasi, jadwal, dan metrik kegiatan pendidikan secara interaktif. Manifestasi transparansi Bidang Pembinaan SD Tabalong.
          </p>
        </motion.section>

        {/* --- STATISTIK & FILTER SECTION --- */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-white/50 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center backdrop-blur-md">
                <FaChartLine className="text-2xl text-blue-500" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 drop-shadow-sm">Ringkasan Data</h3>
                <p className="text-slate-500 font-medium tracking-wide">Analitik spasial kegiatan kependidikan.</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-xl border border-white/80 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <FaFilter className="text-sm" />
                <span className="text-xs font-bold uppercase tracking-wider">Tahun Basis</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="relative">
                <button
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  className="flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100 text-blue-600 font-black text-lg px-4 py-2 rounded-xl transition-colors outline-none border border-blue-100/50"
                >
                  {selectedYear}
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-32 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white p-1 z-50 origin-top-right"
                  >
                    {availableYears.map((yr: any) => (
                      <button
                        key={yr}
                        onClick={() => { setSelectedYear(yr); setIsYearDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedYear === yr ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100/80 hover:text-blue-600'}`}
                      >
                        {yr}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Total Katalog Acara", value: stats.totalEvents, unit: "Acara", icon: <FaCalendarAlt />, color: "blue" },
              { title: "Partisipasi Kolektif", value: stats.totalQuota > 1000 ? (stats.totalQuota / 1000).toFixed(1) : stats.totalQuota, unit: stats.totalQuota > 1000 ? "Ribu" : "Peserta", icon: <FaUsers />, color: "emerald" },
              { title: "Indeks Partisipasi", value: stats.totalResponses, unit: "Responden", icon: <FaSchool />, color: "violet" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all`}
              >
                {/* Glowing Aura inside the liquid glass */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${stat.color}-300/30 rounded-full blur-[40px] group-hover:bg-${stat.color}-300/50 transition-colors duration-500`}></div>

                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-100/80 border border-${stat.color}-200 flex items-center justify-center text-2xl text-${stat.color}-500 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <h3 className="text-slate-500 font-bold tracking-wide">{stat.title}</h3>
                </div>
                <div className="mt-4 relative z-10 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{stat.value}</span>
                  <span className={`text-lg font-bold text-${stat.color}-500 uppercase tracking-wider`}>{stat.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- KONTEN BAWAH: Timeline & Metrik Grafik --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4">

          {/* KOLOM KIRI: Aktivasi Terkini (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 border-b border-white/50 pb-4">
              <span className="w-3 h-8 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa80]"></span>
              Aktivasi Terkini
            </h3>

            <div className="grid grid-cols-1 gap-5">
              {recentEvents.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center text-slate-500 font-medium tracking-wide">
                  <FaCalendarAlt className="mx-auto text-4xl mb-4 text-slate-300" />
                  Belum ada acara yang dijadwalkan.
                </div>
              ) : recentEvents.map((event: any, idx: number) => {
                const evtDate = event._dateObj;
                const now = new Date();
                const isPast = evtDate < new Date(now.setHours(0, 0, 0, 0));
                const isToday = evtDate.toDateString() === new Date().toDateString();

                let status = "AKAN DATANG";
                let statusColor = "blue";
                let iconColor = "text-blue-500";
                let bgIcon = "bg-blue-100/80";
                if (isPast) { status = "SELESAI"; statusColor = "emerald"; iconColor = "text-emerald-500"; bgIcon = "bg-emerald-100/80"; }
                else if (isToday) { status = "BERLANGSUNG"; statusColor = "amber"; iconColor = "text-amber-500"; bgIcon = "bg-amber-100/80"; }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                    className="bg-white/60 hover:bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all group"
                  >
                    <div className={`w-full sm:w-32 h-32 sm:h-28 ${bgIcon} rounded-2xl flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden border border-white/50 shadow-inner`}>
                      <FaCalendarAlt className={`text-4xl ${iconColor} opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500`} />
                      <div className={`absolute top-2 w-[calc(100%-16px)] text-center py-1 rounded-md text-[9px] font-black tracking-wider text-slate-800 bg-white/50 backdrop-blur-md border border-white/50 shadow-sm
                          ${statusColor === 'amber' ? 'text-amber-700' : statusColor === 'emerald' ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {status}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 bg-${statusColor}-50 text-${statusColor}-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-${statusColor}-100 shadow-sm`}>{event.category || 'UMUM'}</span>
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><FaUsers className="text-slate-400" /> {event.quota || "0"} Peserta</span>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors drop-shadow-sm">{event.title || 'Acara Tanpa Judul'}</h4>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><FaMapMarkerAlt className="text-slate-400" /> {event.location || event.type || "-"} <span className="text-slate-300">|</span> {event.date ? new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</p>
                    </div>

                    <Link href={`/${event.slug}`} className="w-full sm:w-auto mt-4 sm:mt-0 px-6 py-4 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 group-hover:shadow-md">
                      Detail <FaArrowRight className="text-sm opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* KOLOM KANAN: Chart & Distribusi (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            {/* Liquid Glass Chart Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 relative overflow-hidden flex flex-col h-[380px] group hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-400/20 transition-colors"></div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 relative z-10 flex items-center gap-2">
                <FaChartLine className="text-blue-500" />
                Tren Bulanan
              </h3>
              <p className="text-xs text-slate-500 mb-6 relative z-10 font-medium">Grafik fluktuasi frekuensi pelaksanaan kegiatan.</p>

              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(226,232,240,1)', borderRadius: '12px', color: '#1e293b', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="event"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Liquid Glass Spatial Map Panel => Category Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 relative overflow-hidden flex-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all"
            >
              <div className="absolute -bottom-10 -right-6 text-9xl text-indigo-50/60 rotate-[-15deg] font-black tracking-tighter mix-blend-multiply select-none pointer-events-none">ACARA</div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-indigo-100/80 rounded-xl text-indigo-600 shadow-sm"><FaCalendarAlt size={16} /></span>
                  Kategori Kegiatan
                </h3>
                <p className="text-slate-500 text-sm mb-6 font-medium">Distribusi rekapitulasi jenis kegiatan yang dijalankan.</p>

                <div className="space-y-5">
                  {categoryDistribution.length === 0 ? (
                    <div className="text-sm font-medium text-slate-400 italic">Belum ada kategori terdeteksi pada tahun ini.</div>
                  ) : categoryDistribution.map((item: any, index: number) => (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-bold text-slate-700">{item.name}</span>
                        <span className={`${item.bgLight} ${item.color} px-2 py-0.5 rounded-md font-black tracking-widest border border-white shadow-sm`}>{item.count} ACARA</span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden shadow-inner border border-white/50">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: item.percentage }}
                          transition={{ duration: 1, delay: index * 0.1, type: "spring" }}
                          className={`h-full rounded-full ${item.bgBar}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* --- Minimalist Liquid Glass Footer --- */}
      <footer className="relative z-20 border-t border-white/80 bg-white/40 backdrop-blur-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.02)] py-6 mt-10">
        <div className="max-w-7xl mx-auto px-6 font-bold tracking-wide text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="uppercase tracking-widest text-slate-400">&copy; 2026 | SARABA SD</p>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
            <span className="uppercase text-[10px] tracking-widest text-slate-500">Dibuat oleh Tim IT Pembinaan SD Disdikbud Tabalong</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FaCalendarCheck, FaUsers, FaChartLine, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalEvents: 0, totalQuota: 0, totalInteractions: 0 });
    const [recentEvents, setRecentEvents] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const loadedEvents: any[] = [];
        let quotaSum = 0;
        let interactionSum = 0;

        try {
            // Load Events
            const eventsSnapshot = await getDocs(collection(db, "events"));
            eventsSnapshot.forEach((docSnap) => {
                const eventData = docSnap.data();
                eventData.slug = docSnap.id;
                eventData._dateObj = eventData.date ? new Date(eventData.date) : new Date(0);
                loadedEvents.push(eventData);

                const quotaNum = parseInt(eventData.quota?.toString() || "0", 10);
                if (!isNaN(quotaNum)) {
                    quotaSum += quotaNum;
                }
            });

            // Load all evaluations dynamically based on events that exist
            // This is a basic implementation. For scalability, we might want a global stats doc.
            const evalPromises = loadedEvents.map(async (evt) => {
                try {
                    const evalSnapshot = await getDocs(collection(db, `events/${evt.slug}/evaluations`));
                    interactionSum += evalSnapshot.size;
                } catch (e) {
                    // Ignore errors if collection doesn't exist yet
                }
            });

            await Promise.all(evalPromises);

            // Sort by date descending
            loadedEvents.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());

            setStats({
                totalEvents: loadedEvents.length,
                totalQuota: quotaSum,
                totalInteractions: interactionSum
            });

            // Take top 5 for recent activities
            setRecentEvents(loadedEvents.slice(0, 5));
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    return (
        <div className="space-y-10 animate-slide-in max-w-7xl mx-auto">

            <div className="flex flex-col gap-2 border-b border-white/50 pb-6">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Satelit Dasbor</h1>
                <p className="text-slate-500 font-medium tracking-wide">Pusat kendali dan ringkasan aktivitas parsial partisipasi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stat Card 1 - Liquid Glass */}
                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] flex items-center gap-6 relative overflow-hidden group transition-all">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-300/30 rounded-full blur-[40px] group-hover:bg-blue-300/60 transition-colors"></div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-500 text-3xl shadow-inner group-hover:scale-110 transition-transform relative z-10 border border-blue-200">
                        <FaCalendarCheck />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold tracking-wide text-slate-500 uppercase">Total Kegiatan</p>
                        <p className="text-5xl font-black text-slate-800 drop-shadow-sm tracking-tighter">{stats.totalEvents}</p>
                    </div>
                </div>

                {/* Stat Card 2 - Liquid Glass */}
                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] flex items-center gap-6 relative overflow-hidden group transition-all">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-300/30 rounded-full blur-[40px] group-hover:bg-emerald-300/60 transition-colors"></div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-500 text-3xl shadow-inner group-hover:scale-110 transition-transform relative z-10 border border-emerald-200">
                        <FaUsers />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold tracking-wide text-slate-500 uppercase">Total Partisipan</p>
                        <p className="text-5xl font-black text-slate-800 drop-shadow-sm tracking-tighter">
                            {stats.totalQuota > 1000 ? (stats.totalQuota / 1000).toFixed(1) + 'K' : stats.totalQuota}
                        </p>
                    </div>
                </div>

                {/* Stat Card 3 - Liquid Glass */}
                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] flex items-center gap-6 relative overflow-hidden group transition-all">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-300/30 rounded-full blur-[40px] group-hover:bg-purple-300/60 transition-colors"></div>
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-500 text-3xl shadow-inner group-hover:scale-110 transition-transform relative z-10 border border-purple-200">
                        <FaChartLine />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold tracking-wide text-slate-500 uppercase">Interaksi Spesifik</p>
                        <p className="text-5xl font-black text-slate-800 drop-shadow-sm tracking-tighter">
                            {stats.totalInteractions > 1000 ? (stats.totalInteractions / 1000).toFixed(1) + 'K' : stats.totalInteractions}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabel Aktivitas (Liquid Glass style) */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
                <div className="p-8 border-b border-white flex justify-between items-center bg-white/40">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-3 h-8 bg-black rounded-full shadow-sm"></span>
                        Aktivitas Terbaru
                    </h3>
                    <Link href="/admin/events" className="text-sm font-bold text-blue-600 flex items-center gap-2 hover:text-blue-800 transition-colors">
                        Lihat Semua <FaArrowRight />
                    </Link>
                </div>

                {recentEvents.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-slate-100/80 rounded-full flex items-center justify-center border border-slate-200/60 shadow-inner">
                            <FaCalendarCheck className="text-3xl text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">Belum ada acara yang dibuat. <Link href="/admin/events/builder/new" className="text-blue-600 hover:underline">Buat Acara Baru.</Link></p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/50">
                        {recentEvents.map((evt, idx) => (
                            <Link key={idx} href={`/admin/events/builder/${evt.slug}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-white/40 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-sm border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FaCalendarCheck />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{evt.title || "Acara Tanpa Judul"}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{evt.category || "Kategori Umum"} • {evt.date ? new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "Tanpa Tanggal"}</p>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex items-center gap-4">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                        {evt.quota || "0"} Kuota
                                    </span>
                                    <FaArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

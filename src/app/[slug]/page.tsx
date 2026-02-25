"use client";

import { useParams } from "next/navigation";
import { FaCalendarAlt, FaMapMarkerAlt, FaLink, FaDownload, FaShareAlt, FaWhatsapp, FaBookOpen, FaBook, FaQuestionCircle, FaFileAlt, FaClipboardList, FaImage, FaTasks, FaStar } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

// Firebase data fetcher
const fetchEventData = async (slug: string) => {
    try {
        const docRef = doc(db, "events", slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as any;
            let timeStr = "";
            if (data.time || data.endTime) {
                if (data.time && data.endTime === 'Selesai') {
                    timeStr = `${data.time} WITA - Selesai`;
                } else if (!data.time && data.endTime === 'Selesai') {
                    timeStr = `Selesai`;
                } else {
                    timeStr = `${data.time || ''}${data.endTime && data.endTime !== data.time && data.endTime !== 'Selesai' ? ` - ${data.endTime}` : ''}`;
                    if (timeStr && !timeStr.includes("WITA")) timeStr += ' WITA';
                }
            }

            let dateStr = "Tanggal belum ditentukan";
            if (data.date) {
                dateStr = new Date(data.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                if (data.endDate && data.endDate !== data.date) {
                    dateStr += ` s.d ${new Date(data.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                }
            }

            return {
                ...data,
                heroImage: data.headerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                logo: data.qrLogo || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Tut_Wuri_Handayani.svg/1024px-Tut_Wuri_Handayani.svg.png",
                time: timeStr,
                dateDisplay: dateStr,
                location: data.location || "Lokasi belum ditentukan",
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching event:", error);
        return null;
    }
};

export default function EventMicrosite() {
    const params = useParams();
    const slug = params?.slug as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<"info" | "evaluasi">("info");

    // Eval Form State
    const [evalName, setEvalName] = useState("");
    const [evalInstitute, setEvalInstitute] = useState("");

    // Complex Eval State
    const [evalNarasumberName, setEvalNarasumberName] = useState("");
    const [evalKegiatanPelatihan, setEvalKegiatanPelatihan] = useState<Record<string, number>>({});
    const [evalKegiatanPanitia, setEvalKegiatanPanitia] = useState<Record<string, number>>({});
    const [evalKegiatanSarpras, setEvalKegiatanSarpras] = useState<Record<string, number>>({});
    const [evalSaranKegiatan, setEvalSaranKegiatan] = useState("");

    const [evalNarasumber, setEvalNarasumber] = useState<Record<string, number>>({});
    const [evalSaranNarasumber, setEvalSaranNarasumber] = useState("");

    const [isSubmittingEval, setIsSubmittingEval] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [respondents, setRespondents] = useState<any[]>([]);
    const [isPast, setIsPast] = useState(false);

    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });
    const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityBg = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

    // 3D Tilt Effect State
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { damping: 30, stiffness: 200 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { damping: 30, stiffness: 200 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = e.clientX - rect.left;
        const mouseYPos = e.clientY - rect.top;
        const xPct = mouseXPos / width - 0.5;
        const yPct = mouseYPos / height - 0.5;
        mouseX.set(xPct);
        mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    useEffect(() => {
        if (slug) {
            setLoading(true);
            fetchEventData(slug).then(async (data) => {
                setEventData(data);
                if (data) {
                    const expiryDateStr = data.endDate || data.date;
                    if (expiryDateStr) {
                        const evtDate = new Date(expiryDateStr);
                        if (evtDate < new Date(new Date().setHours(0, 0, 0, 0))) {
                            setIsPast(true);
                        }
                    }
                }

                // Fetch Respondents from Firestore
                try {
                    const q = query(
                        collection(db, `events/${slug}/evaluations`),
                        orderBy("timestamp", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    const loadedRespondents: any[] = [];
                    querySnapshot.forEach((doc) => {
                        loadedRespondents.push({ id: doc.id, ...doc.data() });
                    });
                    setRespondents(loadedRespondents);
                } catch (error) {
                    console.error("Failed to load evaluations:", error);
                }

                setLoading(false);
            });
            // Check if user already submitted within 24 hours (Local check is still fine for preventing spam per device)
            const savedTime = localStorage.getItem(`eval_acara_time_${slug}`);
            if (savedTime) {
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (now - parseInt(savedTime) < twentyFourHours) {
                    setHasSubmitted(true);
                }
            }
        }
    }, [slug]);

    const handleEvalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evalName || !evalInstitute) {
            toast.error("Mohon lengkapi Nama dan Instansi Pendaftar.");
            return;
        }

        // Validate all criteria are filled (optional based on requirement, but good practice)
        const totalKegiatanQuestions = KRITERIA_PELATIHAN.length + KRITERIA_PANITIA.length + KRITERIA_SARPRAS.length;
        const totalFilledKegiatan = Object.keys(evalKegiatanPelatihan).length + Object.keys(evalKegiatanPanitia).length + Object.keys(evalKegiatanSarpras).length;
        const totalFilledNarasumber = Object.keys(evalNarasumber).length;

        if (totalFilledKegiatan < totalKegiatanQuestions) {
            toast.error("Mohon lengkapi seluruh penilaian aspek Kegiatan.");
            return;
        }

        if (totalFilledNarasumber < KRITERIA_NARASUMBER.length) {
            toast.error("Mohon lengkapi seluruh penilaian aspek Narasumber.");
            return;
        }

        setIsSubmittingEval(true);
        try {
            // Calculate averages for high-level stats
            const sumPelatihan = Object.values(evalKegiatanPelatihan).reduce((a, b) => a + b, 0);
            const sumPanitia = Object.values(evalKegiatanPanitia).reduce((a, b) => a + b, 0);
            const sumSarpras = Object.values(evalKegiatanSarpras).reduce((a, b) => a + b, 0);
            const avgKegiatan = (sumPelatihan + sumPanitia + sumSarpras) / totalKegiatanQuestions;

            const sumNarasumber = Object.values(evalNarasumber).reduce((a, b) => a + b, 0);
            const avgNarasumber = sumNarasumber / KRITERIA_NARASUMBER.length;

            const newEval = {
                timestamp: new Date().toISOString(),
                createdAt: serverTimestamp(),
                name: evalName,
                institute: evalInstitute,

                ratingKegiatan: avgKegiatan,
                ratingNarasumber: avgNarasumber,
                rating: (avgKegiatan + avgNarasumber) / 2, // Legacy fallback compatibility

                details: {
                    narasumberName: evalNarasumberName || "Narasumber Umum",
                    kegiatan: {
                        pelatihan: evalKegiatanPelatihan,
                        panitia: evalKegiatanPanitia,
                        sarpras: evalKegiatanSarpras,
                        saran: evalSaranKegiatan
                    },
                    narasumber: {
                        penilaian: evalNarasumber,
                        saran: evalSaranNarasumber
                    }
                },
                feedback: `Kegiatan: ${evalSaranKegiatan}\nNarasumber: ${evalSaranNarasumber}` // Legacy fallback display
            };

            const docRef = await addDoc(collection(db, `events/${slug}/evaluations`), newEval);

            localStorage.setItem(`eval_acara_time_${slug}`, Date.now().toString());

            setRespondents([{ id: docRef.id, ...newEval, timestamp: new Date().toISOString() }, ...respondents]);
            setHasSubmitted(true);
            toast.success("Evaluasi berhasil dikirim! Terima Kasih.");
        } catch (error) {
            console.error("Error submitting evaluation:", error);
            toast.error("Terjadi kesalahan sistem. Umpan balik gagal dikirim.");
        } finally {
            setIsSubmittingEval(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: eventData?.title || 'Acara S P A N D U K',
            text: `Mari ikuti kegiatan ${eventData?.title}`,
            url: window.location.href
        };

        try {
            // Selalu salin link supaya peserta punya cadangan (dan memunculkan notif)
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Tautan berhasil disalin ke clipboard!");

            if (navigator.share) {
                await navigator.share(shareData);
            }
        } catch (err) {
            console.error("Share failed or cancelled", err);
            // Error yang dimaksud biasanya karena user menekan tombol "Cancel" di menu native share.
            // Tidak perlu menampilkan pesan error jika dibatalkan karena tautan sudah tersalin.
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";

        // Handle YYYY-MM-DD
        if (dateString.includes("-")) {
            const parts = dateString.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        return dateString;
    }

    // --- Criteria Constants ---
    const KRITERIA_PELATIHAN = [
        "Kesesuaian pelatihan dengan kebutuhan",
        "Kelengkapan modul",
        "Kesesuaian media ajar",
        "Kualitas fasilitator"
    ];
    const KRITERIA_PANITIA = [
        "Kerapihan berpakaian",
        "Penyampaian informasi pelatihan",
        "Sikap/sopan santun",
        "Respon terhadap keluhan peserta",
        "Pelayanan administrasi"
    ];
    const KRITERIA_SARPRAS = [
        "Kebersihan ruang",
        "Pencahayaan ruang",
        "Kelayakan furnitur (kursi, meja dll)",
        "Kebersihan toilet",
        "Kualitas audio/sound system",
        "Fasilitas penunjang (Pendingin Udara, Proyektor)",
        "Kelengkapan peserta"
    ];
    const KRITERIA_NARASUMBER = [
        "Penguasaan materi",
        "Cara penyampaian materi",
        "Ketepatan waktu dan kehadiran",
        "Penggunaan metode dan media pembelajaran",
        "Sikap dan perilaku",
        "Cara menjawab pertanyaan dari peserta",
        "Penggunaan bahasa",
        "Pemberian motivasi kepada peserta",
        "Kecakapan menciptakan situasi dinamis kelas",
        "Kerja sama tim"
    ];

    const RatingScaleDescription = () => (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-slate-700 shadow-sm">
            <p className="font-bold text-blue-800 mb-2">PANDUAN PENILAIAN:</p>
            <ul className="space-y-1 ml-1">
                <li><strong className="text-red-500">1 (Buruk)</strong>: Aspek yang dinilai buruk dan perlu banyak perbaikan.</li>
                <li><strong className="text-orange-500">2 (Kurang)</strong>: Masih banyak kekurangan, namun masih dalam batas kewajaran.</li>
                <li><strong className="text-amber-500">3 (Cukup)</strong>: Cukup baik, sesuai harapan namun beberapa hal masih kurang.</li>
                <li><strong className="text-lime-600">4 (Baik)</strong>: Sudah baik, memuaskan dan sedikit sekali kekurangannya.</li>
                <li><strong className="text-emerald-600">5 (Sangat Baik)</strong>: Sangat baik, hampir tidak ada kekurangannya.</li>
            </ul>
        </div>
    );

    const RadioRatingMatrix = ({ criteriaList, stateObject, setStateAction }: { criteriaList: string[], stateObject: any, setStateAction: any }) => (
        <div className="space-y-4">
            {criteriaList.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all md:hover:scale-[1.01]">
                    <span className="text-sm font-semibold text-slate-700 md:w-1/2">{item}</span>
                    <div className="flex w-full md:w-auto bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {[1, 2, 3, 4, 5].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setStateAction((prev: any) => ({ ...prev, [item]: num }))}
                                className={`flex-1 md:w-12 py-2.5 md:py-2 text-sm md:text-base font-bold transition-all border-r border-slate-100 last:border-r-0 ${stateObject[item] === num
                                    ? num <= 2 ? 'bg-red-500 text-white' : num === 3 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div ref={ref} className="min-h-screen bg-[#f8fbff] relative selection:bg-blue-200 overflow-x-hidden font-sans pb-12 perspective-1000">

            {/* Latar Belakang Abstrak & Orbs dengan Paralaks (Liquid Background) */}
            <motion.div style={{ y: yBg, opacity: opacityBg }} className="absolute inset-0 z-0 pointer-events-none overflow-hidden fixed origin-top">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300/30 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-violet-300/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-emerald-200/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[40px]"></div>
            </motion.div>

            {loading ? (
                <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : !eventData ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 relative z-10">
                    <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-red-200">
                        !
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">Acara Tidak Ditemukan</h1>
                    <p className="text-slate-500 max-w-sm">Tautan yang Anda kunjungi mungkin salah, sudah kadaluarsa, atau telah dihapus oleh Admin.</p>
                    <Link href="/" className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                        Kembali ke Beranda
                    </Link>
                </div>
            ) : (
                /* Kontainer Utama (Lebar Tertahan seukuran HP untuk UX yang fokus) */
                <main className="max-w-xl mx-auto px-5 pt-8 md:pt-16 pb-20 relative z-10 w-full animate-slide-in">

                    {/* 3D Tilt Card Container */}
                    <motion.div
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                        className="relative w-full z-20"
                    >
                        {/* Bagian Hero & Banner */}
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-visible flex flex-col relative group transition-all w-full mb-8">

                            {/* Banner Gambar Interaktif */}
                            <div className="w-full h-48 md:h-56 relative bg-slate-200 overflow-hidden rounded-t-[2rem]" style={{ transform: "translateZ(30px)" }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <motion.img
                                    src={eventData.headerImage || eventData.heroImage}
                                    alt="Event Banner"
                                    style={{ y: imageY }}
                                    className="w-full h-[120%] object-cover group-hover:scale-105 transition-transform duration-700 origin-top"
                                />

                                <div className="absolute top-4 right-4 z-20">
                                    <button onClick={handleShare} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/40 transition-colors shadow-sm">
                                        <FaShareAlt />
                                    </button>
                                </div>

                            </div>

                            {/* Profil Logo (Overlap Between Header and Content) */}
                            <div
                                className="absolute z-30 left-1/2 top-48 md:top-56 w-28 h-28 bg-white rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300"
                                style={{ transform: "translateZ(50px) translateX(-50%) translateY(-50%)" }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={eventData.logo} alt="Logo" className="w-[85%] h-[85%] object-contain drop-shadow-sm" />
                            </div>

                            {/* Info Acara (Margin top diberikan untuk mengkompensasi logo) */}
                            <div className="p-6 md:p-8 pt-20 md:pt-24 flex flex-col gap-6 bg-white/40 rounded-b-[2rem]" style={{ transform: "translateZ(20px)" }}>
                                <div className="flex flex-col gap-3 text-center items-center">
                                    <span className="px-3 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-700 text-[10px] sm:text-xs font-black rounded-lg border border-blue-200/50 shadow-[0_2px_10px_rgb(59,130,246,0.1)] uppercase tracking-widest w-max mb-1">
                                        {eventData.category}
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight drop-shadow-sm">
                                        {eventData.title}
                                    </h1>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {eventData.description}
                                    </p>
                                </div>

                                {/* Metrik Waktu & Tempat berbalut glass */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4" style={{ transform: "translateZ(40px)" }}>
                                    <div className="flex items-center justify-center sm:justify-start gap-4 p-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_15px_rgb(0,0,0,0.03)] group/box hover:shadow-[0_8px_25px_rgb(0,0,0,0.05)] transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover/box:scale-110 transition-transform shadow-inner shrink-0">
                                            <FaCalendarAlt />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                                            <span className="text-sm font-bold text-slate-800 leading-tight">{eventData.dateDisplay || formatDate(eventData.date)}</span>
                                            {eventData.time && <span className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{eventData.time}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start gap-4 p-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_15px_rgb(0,0,0,0.03)] group/box hover:shadow-[0_8px_25px_rgb(0,0,0,0.05)] transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover/box:scale-110 transition-transform shadow-inner shrink-0">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasi</span>
                                            <span className="text-sm font-bold text-slate-800 break-words leading-tight">{eventData.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>

                    {/* Navigation Tabs (Only show if isEvaluationOpen is true) */}
                    {eventData?.isEvaluationOpen === true && (
                        <div className="flex justify-center gap-4 mb-6 relative z-10 w-full px-2">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/60 text-slate-500 hover:bg-white/90 border border-slate-200 backdrop-blur-sm'}`}
                            >
                                Informasi Acara
                            </button>
                            <button
                                onClick={() => setActiveTab('evaluasi')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none ${activeTab === 'evaluasi' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/60 text-slate-500 hover:bg-white/90 border border-slate-200 backdrop-blur-sm'}`}
                            >
                                Evaluasi & Feedback
                            </button>
                        </div>
                    )}

                    <div className="relative z-10">
                        {activeTab === 'info' ? (
                            /* Tautan Penting */
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="mt-4 flex flex-col gap-6"
                            >
                                {eventData.sections?.map((section: any) => (
                                    <div key={section.id} className="flex flex-col gap-4">
                                        {section.title && (
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-px bg-slate-300 flex-1"></div>
                                                <h3 className="text-center text-sm font-black tracking-widest text-slate-800 uppercase px-2 py-1 bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200/50 shadow-sm">{section.title}</h3>
                                                <div className="h-px bg-slate-300 flex-1"></div>
                                            </div>
                                        )}

                                        {section.links.map((link: any, index: number) => {
                                            const isLinkLocked = isPast && (link.title.toLowerCase().includes('daftar hadir') || link.title.toLowerCase().includes('presensi') || link.title.toLowerCase().includes('registrasi'));
                                            const InnerLinkContent = () => (
                                                <>
                                                    {/* Efek shimer kilatan cahaya untuk primary button */}
                                                    {link.type === 'primary' && !isLinkLocked && (
                                                        <div className="absolute inset-0 -translate-x-full group-hover/link:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 skew-x-12"></div>
                                                    )}

                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner relative z-10 transition-all duration-300 ${!isLinkLocked ? 'group-hover/link:scale-110' : ''} ${link.type === 'primary' && !isLinkLocked
                                                        ? 'bg-white/20 backdrop-blur-sm group-hover/link:bg-white/40'
                                                        : link.type === 'primary' && isLinkLocked ? 'bg-white/20 backdrop-blur-sm'
                                                            : !isLinkLocked ? 'bg-slate-100 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white group-hover/link:shadow-md'
                                                                : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        {link.icon === 'whatsapp' ? <FaWhatsapp className={`${link.type !== 'primary' && !isLinkLocked ? 'text-emerald-500 group-hover/link:text-white' : ''}`} /> :
                                                            link.icon === 'download' ? <FaDownload /> :
                                                                link.icon === 'map' ? <FaMapMarkerAlt /> :
                                                                    link.icon === 'materi' ? <FaBookOpen /> :
                                                                        link.icon === 'panduan' ? <FaBook /> :
                                                                            link.icon === 'kuis' ? <FaQuestionCircle /> :
                                                                                link.icon === 'ujian' ? <FaFileAlt /> :
                                                                                    link.icon === 'absen' ? <FaClipboardList /> :
                                                                                        link.icon === 'dokumen' ? <FaImage /> :
                                                                                            link.icon === 'tugas' ? <FaTasks /> :
                                                                                                <FaLink />}
                                                    </div>
                                                    <div className="flex flex-col relative z-10 flex-1">
                                                        <span className="font-bold text-sm md:text-base">{link.title}</span>
                                                        {isLinkLocked && <span className="text-[10px] uppercase font-bold text-red-400/80">Telah Ditutup</span>}
                                                    </div>

                                                    {/* Panah arah dikanan */}
                                                    {!isLinkLocked && (
                                                        <svg className={`w-5 h-5 relative z-10 opacity-50 group-hover/link:translate-x-1 group-hover/link:opacity-100 transition-all ${link.type === 'primary' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </>
                                            );

                                            return (
                                                <motion.div
                                                    key={link.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.3 + (index * 0.1) }}
                                                >
                                                    {isLinkLocked ? (
                                                        <div className={`flex items-center gap-4 p-5 rounded-2xl border relative overflow-hidden opacity-60 grayscale cursor-not-allowed ${link.type === 'primary' ? 'bg-slate-400 text-white border-slate-400' : 'bg-slate-100/50 text-slate-500'}`}>
                                                            <InnerLinkContent />
                                                        </div>
                                                    ) : (
                                                        <Link
                                                            href={link.url}
                                                            className={`flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_10px_35px_rgba(37,99,235,0.2)] active:scale-95 group/link border relative overflow-hidden ${link.type === 'primary'
                                                                ? 'bg-blue-600 hover:bg-indigo-600 hover:border-indigo-500 text-white border-blue-500'
                                                                : 'bg-white/60 backdrop-blur-2xl border-white/80 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-700'
                                                                }`}
                                                        >
                                                            <InnerLinkContent />
                                                        </Link>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            /* Tab Evaluasi */
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800">Evaluasi Kegiatan</h2>
                                    <p className="text-sm text-slate-500 mt-2">Masukan Anda sangat berharga untuk peningkatan acara selanjutnya.</p>
                                </div>
                                {hasSubmitted ? (
                                    <div className="animate-fade-in">
                                        <div className="text-center py-6 px-4">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">Terima Kasih!</h3>
                                            <p className="text-slate-500 text-sm">Masukan Anda telah berhasil dicatat oleh sistem.</p>
                                        </div>

                                        <div className="mt-8 border-t border-slate-200 pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Responden</h4>
                                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">{respondents.length} Masukan</span>
                                            </div>
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
                                                {respondents.map((resp, idx) => (
                                                    <div key={resp.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                            {respondents.length - idx}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{resp.name}</p>
                                                            <p className="text-xs text-slate-500">{resp.institute}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : isPast ? (
                                    <div className="animate-fade-in">
                                        <div className="text-center py-6 px-4">
                                            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                                                <FaCalendarAlt className="text-2xl" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">Acara Telah Selesai</h3>
                                            <p className="text-slate-500 text-sm">Form penerimaan evaluasi dan umpan balik acara ini sudah ditutup secara otomatis.</p>
                                        </div>

                                        {respondents.length > 0 && (
                                            <div className="mt-8 border-t border-slate-200 pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Responden</h4>
                                                    <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2 py-1 rounded-md">{respondents.length} Masukan</span>
                                                </div>
                                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
                                                    {respondents.map((resp, idx) => (
                                                        <div key={resp.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 opacity-80">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                                {respondents.length - idx}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{resp.name}</p>
                                                                <p className="text-xs text-slate-500">{resp.institute}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleEvalSubmit} className="space-y-6">
                                        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Identitas Diri
                                            </h3>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                                                <input type="text" value={evalName} onChange={(e) => setEvalName(e.target.value)} required placeholder="Masukkan nama" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Instansi/Unit Kerja <span className="text-red-500">*</span></label>
                                                <input type="text" value={evalInstitute} onChange={(e) => setEvalInstitute(e.target.value)} required placeholder="Contoh: SDN 2 Pembataan" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 mt-8 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Instrumen Evaluasi Kegiatan
                                            </h3>

                                            <RatingScaleDescription />

                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-3 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50 text-sm">A. Pelatihan</h4>
                                                    <RadioRatingMatrix criteriaList={KRITERIA_PELATIHAN} stateObject={evalKegiatanPelatihan} setStateAction={setEvalKegiatanPelatihan} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-3 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50 text-sm">B. Panitia</h4>
                                                    <RadioRatingMatrix criteriaList={KRITERIA_PANITIA} stateObject={evalKegiatanPanitia} setStateAction={setEvalKegiatanPanitia} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-3 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50 text-sm">C. Sarana Prasarana Pelatihan</h4>
                                                    <RadioRatingMatrix criteriaList={KRITERIA_SARPRAS} stateObject={evalKegiatanSarpras} setStateAction={setEvalKegiatanSarpras} />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Saran/Kritik/Keluhan Terkait Kegiatan</label>
                                                    <textarea value={evalSaranKegiatan} onChange={(e) => setEvalSaranKegiatan(e.target.value)} rows={3} placeholder="Materi yang ingin ditambahkan ke depannya, atau keluhan fasilitas..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm resize-none"></textarea>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mt-8 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Instrumen Evaluasi Narasumber
                                            </h3>
                                            <p className="text-sm text-slate-600 mb-4 font-medium italic">"Mohon berkenan memberi penilaian kepada narasumber. Penilaian dari Bapak/Ibu merupakan masukan berharga bagi narasumber untuk lebih baik lagi ke depannya."</p>

                                            {eventData?.narasumberList && (
                                                <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                                                    <label className="block text-sm font-bold text-blue-900 mb-2">Pilih Narasumber yang Dinilai <span className="text-red-500">*</span></label>
                                                    <select required value={evalNarasumberName} onChange={(e) => setEvalNarasumberName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold">
                                                        <option value="" disabled>-- Pilih Nama Narasumber --</option>
                                                        {eventData.narasumberList.split(',').map((name: string, i: number) => (
                                                            <option key={i} value={name.trim()}>{name.trim()}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                <RadioRatingMatrix criteriaList={KRITERIA_NARASUMBER} stateObject={evalNarasumber} setStateAction={setEvalNarasumber} />

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kritik & Saran Khusus untuk Narasumber</label>
                                                    <textarea value={evalSaranNarasumber} onChange={(e) => setEvalSaranNarasumber(e.target.value)} rows={3} placeholder="Penyampaian sudah bagus, namun akan lebih baik jika..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm resize-none"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" disabled={isSubmittingEval} className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all ${isSubmittingEval ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-95'}`}>
                                                {isSubmittingEval ? 'Mengirim...' : 'Kirim Evaluasi'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Powered By Footer */}
                    <div className="mt-14 text-center pb-8 relative z-10">
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-footer.png" alt="Logo Tim SARABA SD" className="h-16 w-auto object-contain drop-shadow-sm" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Dipersembahkan oleh <span className="text-slate-600">Tim SARABA SD</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Bidang Pembinaan SD - Disdikbud Tabalong</p>
                    </div>

                </main>
            )}
        </div>
    );
}

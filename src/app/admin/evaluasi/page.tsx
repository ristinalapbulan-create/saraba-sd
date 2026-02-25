"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaClipboardCheck, FaStar, FaPrint, FaArrowRight, FaSearch } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminEvaluasi() {
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadEventsWithEvals();
    }, []);

    const loadEventsWithEvals = async () => {
        try {
            const eventsSnapshot = await getDocs(collection(db, "events"));
            const loaded: any[] = [];

            const evalPromises = eventsSnapshot.docs.map(async (docSnap) => {
                const eventData = docSnap.data();
                const slug = docSnap.id;

                let evalCount = 0;
                let totalRating = 0;

                try {
                    const evalSnapshot = await getDocs(collection(db, `events/${slug}/evaluations`));
                    evalCount = evalSnapshot.size;

                    evalSnapshot.forEach(evalDoc => {
                        const data = evalDoc.data();
                        totalRating += data.rating || 0; // handle legacy or normalized rating field
                    });
                } catch (e) {
                    // Ignored if evaluations collection doesn't exist yet
                }

                const avgRating = evalCount > 0 ? (totalRating / evalCount).toFixed(1) : "0.0";

                loaded.push({
                    ...eventData,
                    slug: slug,
                    _dateObj: eventData.date ? new Date(eventData.date) : new Date(0),
                    evalCount: evalCount,
                    avgRating: avgRating
                });
            });

            await Promise.all(evalPromises);

            loaded.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());
            setEvents(loaded);
        } catch (error) {
            console.error("Error loading events with evals:", error);
        }
    };

    const filteredEvents = events.filter(evt =>
        evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-slide-in max-w-7xl mx-auto">

            {/* Header Liquid Glass */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 md:p-10 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-[30vw] h-[30vw] bg-emerald-300/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                <FaClipboardCheck className="text-xl" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Evaluasi Acara</h1>
                        </div>
                        <p className="text-slate-500 font-medium max-w-lg">Lihat dan cetak rekapitulasi penilaian, survei, dan saran dari partisipan untuk setiap acara.</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex bg-white/60 backdrop-blur-2xl p-4 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl gap-3">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama acara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                    />
                </div>
            </div>

            {/* Event List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map((evt, idx) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] transition-all group hover:-translate-y-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {evt.category || "Event"}
                            </span>
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 text-amber-600">
                                <FaStar className="text-xs" />
                                <span className="text-sm font-bold">{evt.avgRating}</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                            {evt.title || "Acara Tanpa Judul"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 flex-1">
                            {evt.date ? new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "Tanpa Tanggal"}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responden</span>
                                <span className="text-lg font-black text-slate-700">{evt.evalCount}</span>
                            </div>
                            <Link href={`/admin/evaluasi/${evt.slug}`} className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md hover:shadow-emerald-500/30">
                                Buka Rekap <FaArrowRight />
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredEvents.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/80 border-dashed">
                        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            <FaClipboardCheck />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">Tidak ada data ditemukan</h3>
                        <p className="text-slate-500">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

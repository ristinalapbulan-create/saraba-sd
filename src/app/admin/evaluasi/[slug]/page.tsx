"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPrint, FaStar, FaClipboardCheck, FaChartBar, FaTrash, FaEye, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from "firebase/firestore";

export default function DetailEvaluasi() {
    const params = useParams();
    const slug = params?.slug as string;

    const [event, setEvent] = useState<any>(null);
    const [evals, setEvals] = useState<any[]>([]);
    const [detailModal, setDetailModal] = useState<any>(null);

    useEffect(() => {
        if (slug) {
            const loadData = async () => {
                try {
                    // Load Event Data
                    const eventDoc = await getDoc(doc(db, "events", slug));
                    if (eventDoc.exists()) {
                        setEvent(eventDoc.data());
                    } else {
                        toast.error("Data acara tidak ditemukan.");
                    }

                    // Load Evals
                    const q = query(
                        collection(db, `events/${slug}/evaluations`),
                        orderBy("timestamp", "desc")
                    );
                    const evalSnapshot = await getDocs(q);
                    const loadedEvals: any[] = [];
                    evalSnapshot.forEach((doc) => {
                        loadedEvals.push({ id: doc.id, ...doc.data() });
                    });
                    setEvals(loadedEvals);
                } catch (error) {
                    console.error("Error loading evaluation data:", error);
                    toast.error("Gagal memuat data evaluasi.");
                }
            };
            loadData();
        }
    }, [slug]);

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async (id: string | number) => {
        if (confirm("Apakah Anda yakin ingin menghapus data responden ini?")) {
            try {
                await deleteDoc(doc(db, `events/${slug}/evaluations`, id as string));
                const updatedEvals = evals.filter(ev => ev.id !== id);
                setEvals(updatedEvals);
                if (detailModal?.id === id) setDetailModal(null);
                toast.success("Data berhasil dihapus!");
            } catch (error) {
                console.error("Error deleting evaluation:", error);
                toast.error("Gagal menghapus data evaluasi.");
            }
        }
    };

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium">Memuat Data...</p>
            </div>
        );
    }

    // Kalkulasi Statistik
    let sumKegiatan = 0;
    let sumNarasumber = 0;
    let countKeiatan = 0;
    let countNarasumber = 0;

    evals.forEach(ev => {
        if (ev.ratingKegiatan) {
            sumKegiatan += ev.ratingKegiatan;
            countKeiatan++;
        } else if (ev.ratingPanitia) { // Legacy fallback
            sumKegiatan += ev.ratingPanitia;
            countKeiatan++;
        }

        if (ev.ratingNarasumber) {
            sumNarasumber += ev.ratingNarasumber;
            countNarasumber++;
        } else if (ev.rating) { // Legacy fallback
            sumNarasumber += ev.rating;
            countNarasumber++;
        }
    });

    const avgKegiatan = countKeiatan > 0 ? (sumKegiatan / countKeiatan).toFixed(1) : "0.0";
    const avgNarasumber = countNarasumber > 0 ? (sumNarasumber / countNarasumber).toFixed(1) : "0.0";

    return (
        <div className="animate-slide-in max-w-7xl mx-auto print:max-w-none print:m-0">
            {/* Print Override Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    nav, aside, header, .print-hide {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10pt;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #f1f5f9;
                        font-weight: bold;
                    }
                }
            `}</style>

            {/* Tombol Kembali & Aksi Cetak - Disembunyikan saat cetak */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 print-hide">
                <div className="flex items-center gap-3">
                    <Link href="/admin/evaluasi" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">Rekap Evaluasi</h1>
                        <p className="text-sm text-slate-500">{event.title || "Acara Tanpa Judul"}</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handlePrint} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all active:scale-95">
                        <FaPrint /> Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Kop Surat Header - Hanya tampil jelas saat cetak */}
            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-black uppercase">LAPORAN EVALUASI KEGIATAN</h2>
                <h3 className="text-lg font-bold">{event.title}</h3>
                <p className="text-sm">Pelaksanaan: {event.date} | Kategori: {event.category}</p>
            </div>

            {/* Info Statistik Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print-hide">
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl shrink-0">
                        <FaClipboardCheck />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Responden</p>
                        <p className="text-3xl font-black text-slate-800">{evals.length}</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500 text-2xl shrink-0">
                        <FaStar />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rata-rata Kegiatan</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-slate-800">{avgKegiatan}</p>
                            <span className="text-sm font-bold text-slate-400 mb-1">/ 5.0</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-500 text-2xl shrink-0">
                        <FaStar />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rata-rata Narasumber</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-slate-800">{avgNarasumber}</p>
                            <span className="text-sm font-bold text-slate-400 mb-1">/ 5.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabel Data Evaluasi */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden print:bg-transparent print:border-none print:rounded-none print:shadow-none">
                <div className="p-6 md:p-8 border-b border-white bg-white/40 print-hide">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-3 h-8 bg-emerald-500 rounded-full shadow-sm"></span>
                        Data Responden
                    </h3>
                </div>

                <div className="overflow-x-auto p-1 print:p-0">
                    <table className="w-full text-left print-table">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="p-4 pl-8 font-bold text-slate-500 text-sm whitespace-nowrap">No</th>
                                <th className="p-4 font-bold text-slate-500 text-sm">Nama Lengkap</th>
                                <th className="p-4 font-bold text-slate-500 text-sm">Instansi</th>
                                <th className="p-4 font-bold text-slate-500 text-sm text-center" title="Rata-rata Evaluasi Kegiatan">Avg. Kegiatan</th>
                                <th className="p-4 font-bold text-slate-500 text-sm text-center" title="Rata-rata Evaluasi Narasumber">Avg. Narasumber</th>
                                <th className="p-4 font-bold text-slate-500 text-sm">Saran / Masukan Lengkap</th>
                                <th className="p-4 pr-8 font-bold text-slate-500 text-sm text-center print-hide">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {evals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-500 font-medium">
                                        Belum ada data evaluasi yang masuk untuk acara ini.
                                    </td>
                                </tr>
                            ) : (
                                evals.map((ev, idx) => (
                                    <tr key={ev.id} className="hover:bg-white/40 transition-colors">
                                        <td className="p-4 pl-8 text-sm font-bold text-slate-400">{evals.length - idx}</td>
                                        <td className="p-4 text-sm font-bold text-slate-700">{ev.name}</td>
                                        <td className="p-4 text-sm text-slate-600 truncate max-w-[150px] print:whitespace-normal print:max-w-none" title={ev.institute}>{ev.institute}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 font-bold text-blue-600">
                                                <FaStar className="text-xs" /> {ev.ratingKegiatan ? ev.ratingKegiatan.toFixed(1) : (ev.ratingPanitia || ev.rating || "-")}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 font-bold text-emerald-600">
                                                <FaStar className="text-xs" /> {ev.ratingNarasumber ? ev.ratingNarasumber.toFixed(1) : (ev.rating || "-")}
                                            </div>
                                            {ev.details?.narasumberName && (
                                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] mx-auto mt-1 print:whitespace-normal print:max-w-none" title={ev.details.narasumberName}>
                                                    {ev.details.narasumberName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 max-w-sm print:max-w-none print:text-xs">
                                            {ev.feedback ? (
                                                <p className="line-clamp-3 md:line-clamp-none whitespace-pre-wrap" title={ev.feedback.replace(' | Narasumber:', '\nNarasumber:')}>
                                                    {ev.feedback.replace(' | Narasumber:', '\nNarasumber:')}
                                                </p>
                                            ) : (
                                                <span className="text-slate-300 italic">Tidak ada saran</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-400 text-center print-hide">
                                            {new Date(ev.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 pr-8 text-center print-hide">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setDetailModal(ev)}
                                                    className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center hover:bg-blue-600 opacity-70 hover:opacity-100 hover:text-white transition-all shadow-sm"
                                                    title="Lihat Detail Nilai Kriteria"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ev.id)}
                                                    className="w-8 h-8 rounded-lg bg-red-100/50 text-red-500 flex items-center justify-center hover:bg-red-500 opacity-50 hover:opacity-100 hover:text-white transition-all shadow-sm"
                                                    title="Hapus Data"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail Responden */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print-hide animate-fade-in">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-in">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Detail Evaluasi Responden</h3>
                                <p className="text-sm font-medium text-slate-500">{detailModal.name} - {detailModal.institute}</p>
                            </div>
                            <button onClick={() => setDetailModal(null)} className="w-10 h-10 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Content Scrollable */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#f8fbff]">
                            {/* Jika Data Menggunakan Format Baru (Ganda) */}
                            {detailModal.details ? (
                                <div className="space-y-8">

                                    {/* --- Section Kegiatan --- */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Instrumen Kegiatan
                                            </h4>
                                            <div className="text-blue-600 font-black flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg">
                                                <FaStar className="text-sm" /> {detailModal.ratingKegiatan?.toFixed(1) || "-"}
                                            </div>
                                        </div>

                                        {/* Rincian Kegiatan */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                {/* Pelatihan */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">A. Pelatihan</h5>
                                                    <ul className="space-y-2">
                                                        {detailModal.details.kegiatan.pelatihan && Object.entries(detailModal.details.kegiatan.pelatihan).map(([key, val]) => (
                                                            <li key={key} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-1">
                                                                <span className="text-slate-600">{key}</span>
                                                                <span className={`font-bold ${val === 5 ? 'text-emerald-500' : val === 4 ? 'text-lime-500' : val === 3 ? 'text-amber-500' : 'text-red-500'}`}>{val as React.ReactNode}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {/* Panitia */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">B. Panitia</h5>
                                                    <ul className="space-y-2">
                                                        {detailModal.details.kegiatan.panitia && Object.entries(detailModal.details.kegiatan.panitia).map(([key, val]) => (
                                                            <li key={key} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-1">
                                                                <span className="text-slate-600">{key}</span>
                                                                <span className={`font-bold ${val === 5 ? 'text-emerald-500' : val === 4 ? 'text-lime-500' : val === 3 ? 'text-amber-500' : 'text-red-500'}`}>{val as React.ReactNode}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {/* Sarpras */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">C. Sarana Prasarana</h5>
                                                    <ul className="space-y-2">
                                                        {detailModal.details.kegiatan.sarpras && Object.entries(detailModal.details.kegiatan.sarpras).map(([key, val]) => (
                                                            <li key={key} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-1">
                                                                <span className="text-slate-600">{key}</span>
                                                                <span className={`font-bold ${val === 5 ? 'text-emerald-500' : val === 4 ? 'text-lime-500' : val === 3 ? 'text-amber-500' : 'text-red-500'}`}>{val as React.ReactNode}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {/* Saran Kegiatan */}
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                    <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Saran / Kritik Kegiatan</h5>
                                                    <p className="text-sm text-slate-700 italic">
                                                        {detailModal.details.kegiatan.saran ? `"${detailModal.details.kegiatan.saran}"` : "Tidak ada saran."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Section Narasumber --- */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Instrumen Narasumber
                                                </h4>
                                                <span className="text-xs font-bold text-emerald-600 mt-1 block">Target: {detailModal.details.narasumberName}</span>
                                            </div>
                                            <div className="text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg">
                                                <FaStar className="text-sm" /> {detailModal.ratingNarasumber?.toFixed(1) || "-"}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div>
                                                <ul className="space-y-3">
                                                    {detailModal.details.narasumber.penilaian && Object.entries(detailModal.details.narasumber.penilaian).map(([key, val]) => (
                                                        <li key={key} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-2">
                                                            <span className="text-slate-600">{key}</span>
                                                            <span className={`font-bold px-2 py-0.5 rounded-md ${val === 5 ? 'bg-emerald-100 text-emerald-700' : val === 4 ? 'bg-lime-100 text-lime-700' : val === 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{val as React.ReactNode}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 h-full">
                                                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Saran Khusus Narasumber</h5>
                                                    <p className="text-sm text-slate-700 italic">
                                                        {detailModal.details.narasumber.saran ? `"${detailModal.details.narasumber.saran}"` : "Tidak ada saran."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                /* Jika Data Menggunakan Format Lama (Legacy) */
                                <div className="text-center p-10 bg-white rounded-2xl border border-slate-200">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-2xl">
                                        <FaStar />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">Data Format Lama</h4>
                                    <p className="text-sm text-slate-500 mb-6">Responden ini mengisi form evaluasi dengan versi sebelumnya yang tidak memiliki rincian matriks ganda.</p>
                                    <div className="flex justify-center gap-6 text-left max-w-sm mx-auto p-4 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rating Panitia</p>
                                            <p className="text-xl font-black text-slate-700 flex items-center gap-2"><FaStar className="text-amber-400 text-sm" /> {detailModal.ratingPanitia || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rating Narasumber</p>
                                            <p className="text-xl font-black text-slate-700 flex items-center gap-2"><FaStar className="text-amber-400 text-sm" /> {detailModal.ratingNarasumber || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 text-left max-w-sm mx-auto">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Masukan Umum</p>
                                        <p className="text-sm text-slate-700 italic bg-amber-50 p-3 rounded-lg whitespace-pre-wrap">
                                            "{detailModal.feedback ? detailModal.feedback.replace(' | Narasumber:', '\nNarasumber:') : "Tidak ada rincian"}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    handleDelete(detailModal.id);
                                }}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <FaTrash /> Hapus Responden Ini
                            </button>
                            <button
                                onClick={() => setDetailModal(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Tutup Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

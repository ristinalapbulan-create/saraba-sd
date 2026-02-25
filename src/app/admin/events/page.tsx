"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaPlus, FaSearch, FaFilter, FaEdit, FaLink, FaEllipsisV, FaExternalLinkAlt, FaRegCalendarAlt, FaMapMarkerAlt, FaTrash, FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function AdminEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Active dropdown ID
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLTableSectionElement>(null);

    // Load data from Firestore on mount
    useEffect(() => {
        loadEvents();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "events"));
            const loadedEvents: any[] = [];
            querySnapshot.forEach((docSnap) => {
                const eventData = docSnap.data();
                eventData._key = docSnap.id; // Keep track of the document ID for deletion
                eventData.slug = docSnap.id;
                // Convert date string to Date object for easier sorting/filtering if needed
                eventData._dateObj = eventData.date ? new Date(eventData.date) : null;
                loadedEvents.push(eventData);
            });

            // Sort by date descending (newest first)
            loadedEvents.sort((a, b) => {
                if (!a._dateObj) return 1;
                if (!b._dateObj) return -1;
                return b._dateObj.getTime() - a._dateObj.getTime();
            });
            setEvents(loadedEvents);
        } catch (error) {
            console.error("Error loading events from Firestore:", error);
            toast.error("Gagal memuat daftar acara.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (key: string, title: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus acara "${title}"?`)) {
            try {
                await deleteDoc(doc(db, "events", key));
                toast.success(`Acara "${title}" berhasil dihapus.`);
                loadEvents();
            } catch (error) {
                console.error("Error deleting event:", error);
                toast.error("Gagal menghapus acara.");
            }
        }
        setActiveDropdownId(null);
    };

    const handleCopyLink = (slug: string) => {
        const fullUrl = `https://saraba.disdikbudtabalong.id/${slug}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success("Tautan acara berhasil disalin!");
        setActiveDropdownId(null);
    };

    // Filter logic
    const filteredEvents = events.filter(evt => {
        const matchesSearch = evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            evt.slug?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory ? evt.category === selectedCategory : true;

        let matchesMonth = true;
        if (selectedMonth && evt._dateObj) {
            // Month is 0-indexed in JS Date
            const eventMonth = evt._dateObj.getMonth() + 1;
            matchesMonth = eventMonth.toString() === selectedMonth;
        } else if (selectedMonth && !evt._dateObj) {
            matchesMonth = false; // If filtering by month, hide events without date
        }

        return matchesSearch && matchesCategory && matchesMonth;
    });

    const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
    const months = [
        { value: "1", label: "Januari" },
        { value: "2", label: "Februari" },
        { value: "3", label: "Maret" },
        { value: "4", label: "April" },
        { value: "5", label: "Mei" },
        { value: "6", label: "Juni" },
        { value: "7", label: "Juli" },
        { value: "8", label: "Agustus" },
        { value: "9", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" }
    ];

    return (
        <div className="space-y-8 animate-slide-in max-w-7xl mx-auto pb-20">

            {/* Header Section (Liquid Glass) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/60 backdrop-blur-2xl border border-white/80 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-300/30 rounded-full blur-[80px] group-hover:bg-blue-400/30 transition-colors pointer-events-none"></div>
                <div className="flex flex-col gap-2 relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm">Katalog Acara</h1>
                    <p className="text-slate-500 max-w-lg text-sm sm:text-base font-medium">Membangun, mengatur, dan mempublikasikan halaman acara secara instan. Semua tautan penting di satu tempat bernuansa rapi.</p>
                </div>
                <Link href="/admin/events/builder/new" className="relative z-10 flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 whitespace-nowrap">
                    <FaPlus className="text-sm" /> <span>Buat Baru</span>
                </Link>
            </div>

            {/* Main Table Container (Liquid Glass) */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">

                {/* Toolbar */}
                <div className="p-6 border-b border-white bg-white/40 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:max-w-md">
                            <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari acara, slug, atau kategori..."
                                className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700 transition-all shadow-sm placeholder:font-normal"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white/80 border-white text-slate-600'} backdrop-blur-sm border hover:bg-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95`}
                            >
                                <FaFilter className={showFilters ? 'text-blue-500' : 'text-slate-400'} /> Filter Data
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 px-4 bg-slate-50/50 rounded-xl border border-slate-200/60 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bulan Pelaksanaan</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                >
                                    <option value="">Semua Bulan</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kategori Acara</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-white text-[10px] md:text-xs uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-5 font-bold">Informasi Acara</th>
                                <th className="px-6 py-5 font-bold">Waktu & Lokasi</th>
                                <th className="px-6 py-5 font-bold">Tautan Microsite</th>
                                <th className="px-6 py-5 font-bold">Status</th>
                                <th className="px-6 py-5 font-bold text-center">Aksi Panel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/50" ref={dropdownRef}>

                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-white/40 backdrop-blur-sm border border-white rounded-xl shadow-sm">
                                        Memuat data acara...
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-white/40 backdrop-blur-sm border border-white rounded-xl shadow-sm">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((evt, index) => {
                                    // Status styling logic
                                    let statusBg = "bg-slate-100/80";
                                    let statusText = "text-slate-600";
                                    let statusDot = null;
                                    let statusShadow = "shadow-sm";

                                    if (evt.status?.includes("Aktif")) {
                                        statusBg = "bg-emerald-100/80";
                                        statusText = "text-emerald-700";
                                        statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>;
                                    } else if (evt.status?.includes("Draft")) {
                                        statusBg = "bg-amber-100/80";
                                        statusText = "text-amber-700";
                                    }

                                    // Category styling logic
                                    let catBg = "bg-slate-100/80";
                                    let catText = "text-slate-600";
                                    if (evt.category === "Sosialisasi") { catBg = "bg-indigo-100/80"; catText = "text-indigo-600"; }
                                    if (evt.category?.includes("Bimtek")) { catBg = "bg-blue-100/80"; catText = "text-blue-600"; }
                                    if (evt.category?.includes("Rapat")) { catBg = "bg-emerald-100/80"; catText = "text-emerald-600"; }


                                    return (
                                        <tr key={evt._key} className="hover:bg-blue-50/50 transition-colors group relative">
                                            <td className="px-6 py-5">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center"></div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-slate-800 font-bold text-base group-hover:text-blue-700 transition-colors">{evt.title}</span>
                                                    <span className={`text-[10px] font-black ${catText} ${catBg} px-2 py-0.5 rounded-md w-fit uppercase tracking-widest border border-current opacity-70`}>{evt.category || "Umum"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1 text-sm text-slate-600 font-medium">
                                                    <span className="flex items-start gap-2">
                                                        <FaRegCalendarAlt className="text-slate-400 mt-0.5 shrink-0" />
                                                        <div className="flex flex-col leading-tight">
                                                            <span>
                                                                {evt.date ? new Date(evt.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                                                                {evt.endDate && evt.endDate !== evt.date ? ` s.d ${new Date(evt.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : ""}
                                                            </span>
                                                            {(evt.time || evt.endTime) && (
                                                                <span className="text-[11px] text-slate-500 font-semibold">
                                                                    {evt.time && evt.endTime === 'Selesai' ? `${evt.time} WITA - Selesai` :
                                                                        `${evt.time ? evt.time : ""}${evt.endTime && evt.endTime !== 'Selesai' ? ` - ${evt.endTime}` : ""}${(evt.time || (evt.endTime && evt.endTime !== 'Selesai')) ? ' WITA' : ''}`
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </span>
                                                    <span className="flex items-center gap-2 text-xs text-slate-500">
                                                        <FaMapMarkerAlt className="text-slate-400" />
                                                        <span className="truncate max-w-[150px]">{evt.location || "-"}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Link href={`/${evt.slug}`} target="_blank" className="flex items-center gap-2 text-blue-600 font-mono text-xs bg-blue-50/80 border border-blue-200/50 hover:bg-blue-100 hover:border-blue-300 px-3 py-2 rounded-lg w-fit transition-all shadow-sm max-w-[200px] overflow-hidden">
                                                    <FaLink className="opacity-70 shrink-0" />
                                                    <span className="truncate">/{evt.slug}</span>
                                                    <FaExternalLinkAlt className="ml-1 text-[10px] opacity-50 shrink-0" />
                                                </Link>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`px-3 py-1 ${statusBg} ${statusText} text-[10px] font-black rounded-full border border-current opacity-70 ${statusShadow} uppercase tracking-widest flex items-center gap-1.5`}>
                                                        {statusDot}
                                                        {evt.status?.split("(")[0]?.trim() || "Status"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-bold pl-1 mt-1">{evt.quota || "0"} Quota</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center relative">
                                                <div className="flex items-center justify-center gap-3">
                                                    <Link href={`/admin/events/builder/${evt.slug}`} className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 hover:text-white bg-white hover:bg-blue-500 border border-slate-200 hover:border-blue-500 transition-all shadow-sm active:scale-95 group/btn">
                                                        <FaEdit className="group-hover/btn:scale-110 transition-transform" />
                                                    </Link>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownId(activeDropdownId === evt._key ? null : evt._key);
                                                            }}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeDropdownId === evt._key ? 'bg-slate-200 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-700 bg-transparent hover:bg-white border-transparent hover:border-slate-200 shadow-none hover:shadow-sm'} border`}
                                                        >
                                                            <FaEllipsisV />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {activeDropdownId === evt._key && (
                                                            <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in origin-top-right">
                                                                <div className="py-1">
                                                                    <Link
                                                                        href={`/admin/events/builder/${evt.slug}`}
                                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left w-full"
                                                                    >
                                                                        <FaEdit className="text-slate-400" /> Edit Acara
                                                                    </Link>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCopyLink(evt.slug);
                                                                        }}
                                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left w-full"
                                                                    >
                                                                        <FaCopy className="text-slate-400" /> Salin Tautan
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 my-1 font-bold"></div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(evt._key, evt.title);
                                                                        }}
                                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left w-full"
                                                                    >
                                                                        <FaTrash className="text-red-400" /> Hapus Acara
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

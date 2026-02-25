"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaQrcode, FaPlus, FaTrash, FaGripVertical, FaEye, FaCalendarAlt, FaLink, FaDownload, FaWhatsapp, FaMapMarkerAlt, FaBookOpen, FaBook, FaQuestionCircle, FaFileAlt, FaClipboardList, FaImage, FaTasks } from "react-icons/fa";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function EventBuilder() {
    const params = useParams();
    const id = params.id as string;

    const [activeTab, setActiveTab] = useState("info");

    // Form States - Info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [time, setTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("Event");
    const [slug, setSlug] = useState("");
    const [quota, setQuota] = useState("");
    const [status, setStatus] = useState("Tayang Publik (Aktif)");
    const [theme, setTheme] = useState("modern");
    const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
    const [headerImage, setHeaderImage] = useState<string | null>(null);
    const [narasumberList, setNarasumberList] = useState("");

    // Form States - Links
    const [sections, setSections] = useState<any[]>([]);

    // System States
    const [qrLogo, setQrLogo] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load QR Logo (Local Storage is okay for settings like this if preferred, or could also move to DB later)
        const savedLogo = localStorage.getItem("qrLogo");
        if (savedLogo) {
            setQrLogo(savedLogo);
        }

        // Load Event Data if not 'new'
        const loadData = async () => {
            if (id && id !== "new") {
                setIsLoading(true);
                try {
                    const docRef = doc(db, "events", id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setTitle(data.title || "");
                        setDescription(data.description || "");
                        setDate(data.date || "");
                        setEndDate(data.endDate || "");
                        setTime(data.time || "");
                        setEndTime(data.endTime || "");
                        setLocation(data.location || "");
                        setCategory(data.category || "Event");
                        setSlug(data.slug || id);
                        setQuota(data.quota || "");
                        setStatus(data.status || "Tayang Publik (Aktif)");
                        setTheme(data.theme || "modern");
                        setSections(data.sections || []);
                        setIsEvaluationOpen(data.isEvaluationOpen || false);
                        setHeaderImage(data.headerImage || null);
                        setNarasumberList(data.narasumberList || "");
                    } else {
                        // Fallback check local storage if not in DB? Not necessary if fully migrating.
                        setSlug(id);
                        toast.error("Data acara tidak ditemukan di database.");
                    }
                } catch (e) {
                    console.error("Failed to load event data from Firestore", e);
                    toast.error("Gagal memuat data acara.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Default random slug for new event
                setSlug(`acara-${Date.now().toString().slice(-4)}`);
            }
        };

        loadData();
    }, [id]);

    const handleSave = async () => {
        if (!title || !slug) {
            toast.error("Judul Acara dan Slug Kustom wajib diisi.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title, description, date, endDate, time, endTime, location, category, slug, quota, status, theme, sections, qrLogo, isEvaluationOpen, headerImage, narasumberList,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, "events", slug), payload);
            toast.success("Perubahan pada katalog acara berhasil disimpan.");
        } catch (error) {
            console.error("Error saving event to Firestore:", error);
            toast.error("Gagal menyimpan acara. Periksa koneksi atau izin database.");
        } finally {
            setIsSaving(false);
        }
    };

    const addSection = () => {
        setSections([...sections, { id: Date.now(), title: "", links: [] }]);
    };

    const deleteSection = (id: number) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const addLink = (sectionId: number) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    links: [...s.links, { id: Date.now(), title: "", url: "", icon: "link", type: "secondary" }]
                };
            }
            return s;
        }));
    };

    const deleteLink = (sectionId: number, linkId: number) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    links: s.links.filter((l: any) => l.id !== linkId)
                };
            }
            return s;
        }));
    };

    const moveLink = (sectionId: number, dragIndex: number, hoverIndex: number) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                const newLinks = [...s.links];
                const draggedLink = newLinks[dragIndex];
                newLinks.splice(dragIndex, 1);
                newLinks.splice(hoverIndex, 0, draggedLink);
                return { ...s, links: newLinks };
            }
            return s;
        }));
    };

    const fullUrl = `https://saraba.disdikbudtabalong.id/${slug}`;
    const broadcastText = `Kepada Yth. Seluruh Peserta,\n\nBerikut adalah portal resmi kegiatan "${title}". Silakan akses informasi selengkapnya melalui tautan ini:\n\n👉 ${fullUrl}\n\nDemikian informasi ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.\n\nSalam hormat,\nBidang Pembinaan SD\nDinas Pendidikan dan Kebudayaan Kabupaten Tabalong`;

    const handleDownloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return toast.error("QR Code belum siap diunduh.");

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Convert SVG string to base64
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const size = 1000;
            const padding = 100;
            const innerSize = size - (padding * 2);

            canvas.width = size;
            canvas.height = size;
            // Draw a white background first to avoid transparency issues
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the QR Code centered with padding
                ctx.drawImage(img, padding, padding, innerSize, innerSize);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR_${slug || 'event'}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                toast.error("Ukuran maksimal foto header adalah 3MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeaderImage(reader.result as string);
                toast.success("Foto header berhasil dimuat.");
            };
            reader.readAsDataURL(file);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        if (dateString.includes("-")) {
            const parts = dateString.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        return dateString;
    };

    // Komponen Live Preview
    const renderLivePreview = () => {
        return (
            <div className={`w-full h-full xl:min-h-[700px] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden shadow-2xl relative bg-[#f8fbff]`}>
                {/* Speaker Grill Notch Dummy */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                    <div className="w-32 h-6 bg-slate-900 rounded-b-xl"></div>
                </div>

                <div className="absolute inset-0 overflow-y-auto w-full h-full pb-20 pt-16 px-5 custom-scrollbar flex flex-col items-center">

                    {/* Header Event */}
                    {headerImage ? (
                        <div className="w-full h-40 rounded-2xl mb-8 relative overflow-hidden shadow-md border border-slate-200">
                            <img src={headerImage} alt="Header" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                                <h2 className={`text-xl font-bold leading-tight text-white`}>{title || "Judul Acara"}</h2>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full text-center space-y-4 mb-8">
                            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-white text-blue-600 border border-slate-100`}>
                                📅
                            </div>
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 bg-blue-100 text-blue-700`}>
                                    {category || "Kategori"}
                                </span>
                                <h2 className={`text-xl font-bold leading-tight text-slate-800`}>{title || "Judul Acara"}</h2>
                            </div>
                            <p className={`text-sm text-slate-500 leading-relaxed px-2`}>
                                {description || "Deskripsi acara akan tampil di sini..."}
                            </p>
                        </div>
                    )}

                    {/* Event Stats / Info Details */}
                    {(date || endDate || time || endTime || location) && (
                        <div className={`w-full p-4 rounded-2xl mb-6 flex flex-col gap-3 bg-white border border-slate-200 text-slate-800 shadow-sm`}>
                            {(date || endDate || time || endTime) && (
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 shrink-0`}>
                                        <FaCalendarAlt className={'text-blue-600'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-xs font-semibold text-slate-500`}>Pelaksanaan</p>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">
                                                {date ? formatDate(date) : ''}
                                                {endDate && endDate !== date ? ` s.d ${formatDate(endDate)}` : ''}
                                            </span>
                                            {(time || endTime) && (
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {time && endTime === 'Selesai' ? `${time} WITA - Selesai` :
                                                        `${time ? time : ''}${endTime && endTime !== 'Selesai' ? ` - ${endTime}` : ''}${(time || (endTime && endTime !== 'Selesai')) ? ' WITA' : ''}`
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {location && (
                                <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 shrink-0`}>
                                        <FaMapMarkerAlt className={'text-blue-600'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-xs font-semibold text-slate-500`}>Tempat</p>
                                        <p className={`text-sm font-bold text-slate-800`}>{location}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Links Section */}
                    <div className="w-full space-y-6">
                        {sections.map((section) => (
                            <div key={section.id} className="space-y-3">
                                {section.title && (
                                    <h3 className={`text-sm font-bold ml-2 uppercase tracking-widest text-slate-400`}>
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-3">
                                    {section.links.map((link: any) => (
                                        <a key={link.id} href="#" onClick={(e) => e.preventDefault()} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm border ${link.type === 'primary' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-700 border-slate-200'}`}>
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${link.type === 'primary' ? 'bg-white/20' : 'bg-slate-100 text-blue-600'}`}>
                                                {link.icon === 'whatsapp' ? <FaWhatsapp /> :
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
                                            <span className="flex-1 pr-4">{link.title || "Tautan Kosong"}</span>
                                        </a>
                                    ))}
                                    {section.links.length === 0 && (
                                        <div className={`p-4 rounded-2xl border border-dashed text-center text-sm border-slate-300 text-slate-400`}>
                                            Belum ada tautan ditambahkan
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {sections.length === 0 && (
                            <div className={`p-6 rounded-2xl border border-dashed text-center text-sm border-slate-300 text-slate-400`}>
                                Belum ada seksi tautan dibuat
                            </div>
                        )}
                    </div>

                    <div className={`mt-10 mb-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-slate-800`}>
                        Didukung oleh Saraba
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-slide-in pb-20">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Link href="/admin/events" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Builder: {title || "Acara Baru"}</h1>
                        <p className="text-xs text-slate-500">Status: <span className={`font-medium ${status.includes('Aktif') ? 'text-emerald-600' : status.includes('Draft') ? 'text-amber-600' : 'text-slate-600'}`}>{status.split('(')[0].trim()}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleSave} disabled={isSaving || isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-md">
                        <FaSave /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* KIRI: Builder Form */}
                <div className="flex-1 w-full space-y-6">
                    {/* Builder Tabs */}
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Informasi Dasar
                        </button>
                        <button
                            onClick={() => setActiveTab('links')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'links' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Tata Tautan (Links)
                        </button>
                        <button
                            onClick={() => setActiveTab('share')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'share' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Distribusi & QR Code
                        </button>
                    </div>

                    {/* Tab: Informasi Dasar */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 gap-6 animate-fade-in">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Profil Kegiatan</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Acara *</label>
                                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Header Kustom (Opsional)</label>
                                        <div className="flex items-center gap-4">
                                            <input type="file" accept="image/*" onChange={handleHeaderImageUpload} id="headerImageUpload" className="hidden" />
                                            <label htmlFor="headerImageUpload" className="px-4 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 cursor-pointer transition-colors text-sm border border-blue-200 flex items-center gap-2">
                                                <FaImage /> Unggah Foto (Maks 3MB)
                                            </label>
                                            {headerImage && (
                                                <button onClick={() => setHeaderImage(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">Hapus</button>
                                            )}
                                        </div>
                                        {headerImage && (
                                            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">✓ Foto terpasang</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi & Instruksi</label>
                                        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Selesai (Opsional)</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Waktu Mulai (Opsional)</label>
                                            <div className="flex items-center">
                                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                                <span className="px-4 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm font-bold">WITA</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-semibold text-slate-700">Waktu Selesai (Opsional)</label>
                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                                    <input type="checkbox" checked={endTime === 'Selesai'} onChange={(e) => setEndTime(e.target.checked ? 'Selesai' : '')} className="rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                                                    <span className="font-semibold">Sampai Selesai</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input type="time" value={endTime === 'Selesai' ? '' : endTime} onChange={(e) => setEndTime(e.target.value)} disabled={endTime === 'Selesai'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed" />
                                                <span className="px-4 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm font-bold">WITA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tempat / Lokasi</label>
                                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Zoom Meeting, Aula Disdikbud..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori Kegiatan</label>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                                <option value="Event">Event</option>
                                                <option value="Sosialisasi">Sosialisasi</option>
                                                <option value="Bimbingan Teknis (Bimtek)">Bimbingan Teknis (Bimtek)</option>
                                                <option value="Rapat Koordinasi">Rapat Koordinasi</option>
                                                <option value="Lomba">Lomba</option>
                                                <option value="Workshop">Workshop</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Tautan Pendek (URL)</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Slug Kustom *</label>
                                        <div className="flex items-center">
                                            <span className="px-4 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-sm font-mono whitespace-nowrap hidden sm:inline-block">saraba.disdikbudtabalong.id/</span>
                                            <span className="px-4 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-sm font-mono whitespace-nowrap sm:hidden">.../</span>
                                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, ''))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm" />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Pastikan tautan unik dan mudah diingat.</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Daftar Narasumber (Untuk Form Evaluasi)</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nama-nama Narasumber</label>
                                        <input type="text" value={narasumberList} onChange={(e) => setNarasumberList(e.target.value)} placeholder="Contoh: Bpk. Ahmad, Ibu Sari, Narasumber Utama" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                                        <p className="text-xs text-slate-500 mt-2">Pisahkan dengan koma (,). Jika dibiarkan kosong, form evaluasi narasumber hanya akan menampilkan opsi nilai kriteria tanpa pilihan nama.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Metrik Dasbor Publik</h3>
                                <p className="text-xs text-slate-500">Data ini akan ditampilkan di halaman utama.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Estimasi Peserta</label>
                                        <input type="number" value={quota} onChange={(e) => setQuota(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Status Visibilitas</label>
                                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold">
                                            <option>Tayang Publik (Aktif)</option>
                                            <option>Draft (Sembunyikan)</option>
                                            <option>Arsip (Selesai)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Formulir Evaluasi Publik</label>
                                        <select value={isEvaluationOpen ? "true" : "false"} onChange={(e) => setIsEvaluationOpen(e.target.value === "true")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                            <option value="true">Buka (Tampilkan Tab Evaluasi)</option>
                                            <option value="false">Tutup (Sembunyikan Tab Evaluasi)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Tata Tautan (Links) */}
                    {activeTab === 'links' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Manajemen Tautan & Seksi</h3>
                                    <p className="text-sm text-slate-500">Kelompokkan tombol-tombol berdasarkan kategori informasinya.</p>
                                </div>
                                <button onClick={addSection} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all shrink-0">
                                    <FaPlus /> Seksi Baru
                                </button>
                            </div>

                            <div className="space-y-6">
                                {sections.map((section) => (
                                    <div key={section.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative group">
                                        <button onClick={() => deleteSection(section.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors hidden sm:group-hover:block" title="Hapus Seksi">
                                            <FaTrash />
                                        </button>
                                        <div className="mb-4 pr-10">
                                            <input type="text" value={section.title} onChange={(e) => {
                                                setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s));
                                            }} placeholder="Nama Seksi (Opsional)" className="w-full sm:w-1/2 bg-transparent text-lg font-bold text-slate-800 outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-colors pb-1 placeholder:text-slate-400" />
                                        </div>
                                        <div className="space-y-3 pl-2 sm:pl-8 border-l-2 border-indigo-200">
                                            {section.links.map((link: any, index: number) => (
                                                <div
                                                    key={link.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', index.toString());
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        (e.target as HTMLElement).classList.add('opacity-50', 'ring-2', 'ring-blue-500', 'scale-[0.98]');
                                                    }}
                                                    onDragEnd={(e) => {
                                                        (e.target as HTMLElement).classList.remove('opacity-50', 'ring-2', 'ring-blue-500', 'scale-[0.98]');
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                        const dropIndex = index;
                                                        if (dragIndex !== dropIndex && !isNaN(dragIndex)) {
                                                            moveLink(section.id, dragIndex, dropIndex);
                                                        }
                                                    }}
                                                    className="flex flex-col xl:flex-row gap-3 items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm group/link transition-all cursor-move hover:border-blue-300"
                                                >
                                                    <FaGripVertical className="text-slate-300 hidden xl:block hover:text-indigo-500 grab-indicator" />

                                                    {/* Kumpulan Pengaturan Tautan */}
                                                    <div className="flex flex-wrap sm:flex-nowrap w-full gap-3" onClick={(e) => e.stopPropagation()}>

                                                        <select value={link.type} onChange={(e) => {
                                                            setSections(sections.map(s => s.id === section.id ? { ...s, links: s.links.map((l: any) => l.id === link.id ? { ...l, type: e.target.value } : l) } : s));
                                                        }} className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 shrink-0">
                                                            <option value="secondary">Sekunder</option>
                                                            <option value="primary">Primer (Utama)</option>
                                                        </select>

                                                        <div className="relative w-full sm:w-40 shrink-0">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                {link.icon === 'whatsapp' ? <FaWhatsapp /> :
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
                                                            <select value={link.icon} onChange={(e) => {
                                                                setSections(sections.map(s => s.id === section.id ? { ...s, links: s.links.map((l: any) => l.id === link.id ? { ...l, icon: e.target.value } : l) } : s));
                                                            }} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                                                                <option value="link">Tautan</option>
                                                                <option value="whatsapp">WhatsApp</option>
                                                                <option value="download">Unduhan</option>
                                                                <option value="map">Lokasi/Peta</option>
                                                                <option value="materi">Materi</option>
                                                                <option value="panduan">Panduan</option>
                                                                <option value="kuis">Kuis</option>
                                                                <option value="ujian">Ujian</option>
                                                                <option value="absen">Daftar Hadir</option>
                                                                <option value="dokumen">Dokumentasi</option>
                                                                <option value="tugas">Tugas</option>
                                                            </select>
                                                        </div>

                                                        <input type="text" value={link.title} onChange={(e) => {
                                                            setSections(sections.map(s => s.id === section.id ? { ...s, links: s.links.map((l: any) => l.id === link.id ? { ...l, title: e.target.value } : l) } : s));
                                                        }} placeholder="Judul Tautan" className="w-full sm:w-[30%] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500" />

                                                        <input type="text" value={link.url} onChange={(e) => {
                                                            setSections(sections.map(s => s.id === section.id ? { ...s, links: s.links.map((l: any) => l.id === link.id ? { ...l, url: e.target.value } : l) } : s));
                                                        }} placeholder="URL Tujuan (https://...)" className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                                                    </div>

                                                    <button onClick={() => deleteLink(section.id, link.id)} className="text-slate-300 hover:text-red-500 w-full xl:w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors shrink-0" title="Hapus Tautan"><FaTrash /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addLink(section.id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mt-2 w-fit px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <FaPlus className="text-xs" /> Tambah Tombol di Sini
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sections.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-500 font-medium">Belum ada seksi tautan yang dibuat.</p>
                                        <button onClick={addSection} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-all">
                                            <FaPlus /> Buat Seksi Pertama
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Distribusi & QR Code */}
                    {activeTab === 'share' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                                <h3 className="text-xl font-bold text-slate-800">QR Code Akses</h3>
                                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 relative">
                                    <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center relative p-3">
                                        <QRCodeSVG
                                            id="qr-code-svg"
                                            value={fullUrl}
                                            size={170}
                                            level={"H"}
                                            includeMargin={false}
                                            imageSettings={qrLogo ? {
                                                src: qrLogo,
                                                x: undefined,
                                                y: undefined,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            } : undefined}
                                        />
                                    </div>
                                    <p className="mt-3 text-[10px] font-mono font-medium text-slate-600 bg-white px-3 py-1.5 border border-slate-200 rounded-lg max-w-[192px] overflow-hidden text-ellipsis whitespace-nowrap" title={fullUrl}>{fullUrl}</p>
                                </div>
                                <div className="space-y-3 w-full max-w-[192px]">
                                    <button onClick={handleDownloadQR} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                                        <FaDownload /> Unduh QR Code
                                    </button>
                                    {!qrLogo && (
                                        <Link href="/admin/settings" className="w-full flex justify-center text-xs text-blue-600 hover:underline">
                                            Pasang Logo di Pengaturan
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-6 flex flex-col h-full">
                                <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                        <FaEye className="text-9xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 relative z-10 w-fit">Publikasi Link</h3>
                                    <p className="text-indigo-200 text-sm mb-6 relative z-10 max-w-sm">Salin teks di bawah ini untuk broadcast WhatsApp atau grup telegram acara Anda.</p>

                                    <div className="bg-indigo-950/50 border border-indigo-800/50 p-4 rounded-xl text-xs sm:text-sm font-mono text-indigo-100 relative z-10 break-words mb-6 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                        {broadcastText}
                                    </div>

                                    <button onClick={() => {
                                        navigator.clipboard.writeText(broadcastText);
                                        toast.success("Teks broadcast berhasil disalin!");
                                    }} className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors w-full mt-auto relative z-10 shadow-md">
                                        Salin Teks Broadcast
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* KANAN: Live Preview Microsite */}
                <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 sticky top-28 hidden lg:block pb-10">
                    <div className="mb-4 flex justify-between items-end px-1">
                        <div>
                            <h3 className="font-bold text-slate-800">Pratinjau Langsung</h3>
                            <p className="text-xs text-slate-500">Tampilan di perangkat seluler</p>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 shadow-sm">Live</div>
                    </div>
                    {renderLivePreview()}
                </div>

                {/* Mobile Show Preview Button (Visible on Small Screens) */}
                <div className="lg:hidden w-full fixed bottom-6 left-0 px-4 z-50">
                    <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border border-slate-700">
                        <FaEye /> Lihat Pratinjau Microsite Langsung
                    </button>
                </div>
            </div>
        </div>
    );
}

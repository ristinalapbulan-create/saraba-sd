"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartPie, FaListUl, FaCog, FaSignOutAlt, FaRocket, FaClipboardCheck } from "react-icons/fa";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#f1f5f9] text-slate-800 relative overflow-hidden font-sans selection:bg-blue-200">
            {/* Soft Grid Background Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-300/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[30%] right-[-10%] w-[35vw] h-[35vw] bg-violet-300/30 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[30px]"></div>
            </div>

            {/* Sidebar liquid glass */}
            <aside className="w-64 bg-white/60 backdrop-blur-2xl border-r border-white/80 shadow-[10px_0_30px_rgb(0,0,0,0.03)] hidden md:flex flex-col relative z-20">
                <div className="p-6 border-b border-white/50 flex flex-col gap-1 items-center justify-center pt-8 pb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl border border-blue-200 shadow-sm mb-2 hover:scale-105 transition-transform">
                        S
                    </div>
                    <h2 className="text-xl font-extrabold tracking-widest text-slate-800 leading-none drop-shadow-sm">
                        SARABA
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Admin Panel</span>
                </div>

                <nav className="flex-1 p-5 space-y-3 overflow-y-auto">
                    <Link
                        href="/admin"
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all group font-bold ${pathname === '/admin' ? 'bg-white/80 text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-white/80' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent hover:border-white/80'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${pathname === '/admin' ? 'bg-blue-100/80 text-blue-600' : 'bg-slate-100 group-hover:bg-blue-100/80'}`}>
                            <FaChartPie className="text-sm group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="tracking-wide text-sm">Dasbor</span>
                    </Link>
                    <Link
                        href="/admin/events"
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all group font-bold ${pathname.startsWith('/admin/events') ? 'bg-white/80 text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-white/80' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent hover:border-white/80'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${pathname.startsWith('/admin/events') ? 'bg-blue-100/80 text-blue-600' : 'bg-slate-100 group-hover:bg-blue-100/80'}`}>
                            <FaListUl className="text-sm group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="tracking-wide text-sm">Katalog Acara</span>
                    </Link>
                    <Link
                        href="/admin/evaluasi"
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all group font-bold ${pathname.startsWith('/admin/evaluasi') ? 'bg-white/80 text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-white/80' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent hover:border-white/80'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${pathname.startsWith('/admin/evaluasi') ? 'bg-blue-100/80 text-blue-600' : 'bg-slate-100 group-hover:bg-blue-100/80'}`}>
                            <FaClipboardCheck className="text-sm group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="tracking-wide text-sm">Evaluasi</span>
                    </Link>
                    <Link
                        href="/admin/settings"
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all group font-bold ${pathname.startsWith('/admin/settings') ? 'bg-white/80 text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-white/80' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent hover:border-white/80'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${pathname.startsWith('/admin/settings') ? 'bg-blue-100/80 text-blue-600' : 'bg-slate-100 group-hover:bg-blue-100/80'}`}>
                            <FaCog className="text-sm group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="tracking-wide text-sm">Pengaturan</span>
                    </Link>
                </nav>

                <div className="p-5 border-t border-white/50 space-y-4 pb-6 mt-auto">
                    <Link href="/" className="flex items-center justify-center px-5 py-4 w-full rounded-2xl text-blue-600 bg-blue-50/80 border border-blue-100/50 hover:bg-blue-100 transition-colors group font-bold shadow-sm">
                        <span className="text-xs uppercase tracking-widest flex items-center gap-2">
                            <FaRocket className="group-hover:-translate-y-1 transition-transform" /> Layar Publik
                        </span>
                    </Link>
                    <button onClick={() => {
                        document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        window.location.href = "/login";
                    }} className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100 transition-all group font-bold shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-red-100/80 flex items-center justify-center transition-colors text-slate-400 group-hover:text-red-500">
                            <FaSignOutAlt className="text-sm" />
                        </div>
                        <span className="tracking-wide text-sm">Keluar Sesi</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full">
                {/* Topbar liquid glass */}
                <header className="h-20 bg-white/60 backdrop-blur-2xl border-b border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center px-8 justify-between relative z-20">
                    <div className="font-extrabold tracking-widest text-slate-300 md:opacity-0 text-sm flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">S</div>
                    </div>

                    <div className="flex items-center gap-5 ml-auto">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700">Admin Utama</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disdikbud Tabalong</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black shadow-sm relative hover:scale-105 transition-transform cursor-pointer">
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
                            A
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-10 hide-scrollbar pb-[100px] md:pb-32">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_rgb(0,0,0,0.05)] z-40 pb-safe">
                <div className="flex justify-around items-center px-2 py-3">
                    <Link href="/admin" className={`flex flex-col items-center gap-1 w-1/4 ${pathname === '/admin' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500 transition-colors'}`}>
                        <div className={`p-1.5 rounded-xl ${pathname === '/admin' ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <FaChartPie className="text-lg" />
                        </div>
                        <span className="text-[10px] font-bold">Dasbor</span>
                    </Link>
                    <Link href="/admin/events" className={`flex flex-col items-center gap-1 w-1/4 ${pathname.startsWith('/admin/events') ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500 transition-colors'}`}>
                        <div className={`p-1.5 rounded-xl ${pathname.startsWith('/admin/events') ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <FaListUl className="text-lg" />
                        </div>
                        <span className="text-[10px] font-bold">Acara</span>
                    </Link>
                    <Link href="/admin/evaluasi" className={`flex flex-col items-center gap-1 w-1/4 ${pathname.startsWith('/admin/evaluasi') ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500 transition-colors'}`}>
                        <div className={`p-1.5 rounded-xl ${pathname.startsWith('/admin/evaluasi') ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <FaClipboardCheck className="text-lg" />
                        </div>
                        <span className="text-[10px] font-bold">Evaluasi</span>
                    </Link>
                    <Link href="/admin/settings" className={`flex flex-col items-center gap-1 w-1/4 ${pathname.startsWith('/admin/settings') ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500 transition-colors'}`}>
                        <div className={`p-1.5 rounded-xl ${pathname.startsWith('/admin/settings') ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <FaCog className="text-lg" />
                        </div>
                        <span className="text-[10px] font-bold">Pengaturan</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}

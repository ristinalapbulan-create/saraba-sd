"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaLock, FaArrowRight, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const adminDocRef = doc(db, "settings", "admin");
            const adminDocSnap = await getDoc(adminDocRef);

            let actualPassword = "tabalong2026"; // Fallback default

            if (adminDocSnap.exists()) {
                actualPassword = adminDocSnap.data().password || "tabalong2026";
            } else {
                // Initialize default password if document doesn't exist
                await setDoc(adminDocRef, { password: "tabalong2026" });
            }

            if (password === actualPassword) {
                // Set cookie valid for 1 day
                document.cookie = "adminAuth=authorized; path=/; max-age=86400;";
                toast.success("Akses Diberikan. Mengalihkan...");

                setTimeout(() => {
                    router.push("/admin");
                }, 800);
            } else {
                toast.error("Kata sandi salah. Akses ditolak.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Login verification error:", error);
            toast.error("Terjadi kesalahan sistem. Coba lagi.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-blue-200 p-4">

            {/* Background Orbs */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-300/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-blue-300/30 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[30px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-8 relative z-10"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-3xl border border-blue-200 shadow-sm mb-4">
                        S
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-widest text-slate-800 leading-none drop-shadow-sm mb-1">
                        SARABA SD
                    </h1>
                    <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                        Gerbang Adminstrator
                    </span>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Kunci Akses</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <FaLock />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan kata sandi..."
                                className="w-full pl-11 pr-12 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-inner"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgb(59,130,246,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Memverifikasi...</span>
                        ) : (
                            <>
                                Lanjutkan <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200/50 text-center">
                    <Link href="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                        &larr; Kembali ke Layar Publik
                    </Link>
                </div>
            </motion.div>

            <div className="mt-8 text-[10px] font-bold text-slate-400 tracking-widest uppercase relative z-10 text-center">
                &copy; 2026 | Pembinaan SD Tabalong
            </div>
        </div>
    );
}

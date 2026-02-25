"use client";

import { useState, useEffect } from "react";
import { FaSave, FaLock, FaImage, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AdminSettings() {
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        const savedLogo = localStorage.getItem("qrLogo");
        if (savedLogo) {
            setLogoPreview(savedLogo);
        }
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new !== passwordData.confirm) {
            toast.error("Kata sandi baru tidak cocok!");
            return;
        }
        if (passwordData.new.length < 6) {
            toast.error("Kata sandi minimal 6 karakter!");
            return;
        }

        setIsSavingPassword(true);
        try {
            const adminDocRef = doc(db, "settings", "admin");
            const adminDocSnap = await getDoc(adminDocRef);

            let actualPassword = "tabalong2026";
            if (adminDocSnap.exists()) {
                actualPassword = adminDocSnap.data().password || "tabalong2026";
            }

            if (passwordData.current !== actualPassword) {
                toast.error("Kata sandi saat ini salah!");
                setIsSavingPassword(false);
                return;
            }

            await setDoc(adminDocRef, { password: passwordData.new }, { merge: true });

            toast.success("Kata sandi berhasil diperbarui!");
            setPasswordData({ current: "", new: "", confirm: "" });
        } catch (error) {
            console.error("Error updating password:", error);
            toast.error("Gagal memperbarui kata sandi. Coba lagi.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleLogoSave = () => {
        if (logoFile || logoPreview) {
            if (logoPreview) {
                localStorage.setItem("qrLogo", logoPreview);
            }
            toast.success("Logo visual berhasil disimpan!");
        } else {
            toast.error("Silakan unggah logo terlebih dahulu.");
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-10 animate-slide-in max-w-5xl mx-auto pb-20">

            <div className="flex flex-col gap-2 border-b border-white/50 pb-6">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Pengaturan Sistem</h1>
                <p className="text-slate-500 font-medium tracking-wide">Kelola keamanan akun dan preferensi aset visual (Logo QR).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Keamanan Akun (Ganti Password) */}
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col h-full relative group hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-300/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-400/20 transition-colors"></div>
                    <div className="p-8 border-b border-white/50 bg-white/40 flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 text-xl border border-rose-200 shadow-sm">
                            <FaLock />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Keamanan Akun</h2>
                            <p className="text-xs text-slate-500 font-medium">Perbarui kata sandi admin Anda.</p>
                        </div>
                    </div>

                    <div className="p-8 flex-1 relative z-10">
                        <form onSubmit={handlePasswordChange} className="space-y-5">


                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Kata Sandi Saat Ini</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    className="w-full px-5 py-3 bg-white/80 backdrop-blur-sm border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700 transition-all shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    className="w-full px-5 py-3 bg-white/80 backdrop-blur-sm border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm font-bold text-slate-700 transition-all shadow-sm"
                                    placeholder="Min. 6 karakter"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Konfirmasi Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    className="w-full px-5 py-3 bg-white/80 backdrop-blur-sm border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm font-bold text-slate-700 transition-all shadow-sm"
                                    placeholder="Ketik ulang kata sandi baru"
                                />
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={isSavingPassword || !passwordData.current || !passwordData.new || !passwordData.confirm} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-rose-500/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <FaSave /> {isSavingPassword ? "Menyimpan..." : "Simpan Kata Sandi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 2. Visual Aset (Logo QR Code) */}
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col h-full relative group hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all">
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-300/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-400/20 transition-colors"></div>
                    <div className="p-8 border-b border-white/50 bg-white/40 flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-500 text-xl border border-violet-200 shadow-sm">
                            <FaImage />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Visual Aset (QR)</h2>
                            <p className="text-xs text-slate-500 font-medium">Unggah logo tengah untuk QR Code Acara.</p>
                        </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col relative z-10">
                        <div className="flex-1 space-y-6">

                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 hover:bg-white/80 transition-colors group/upload cursor-pointer relative overflow-hidden"
                                onClick={() => document.getElementById('logo-upload')?.click()}>
                                <input
                                    type="file"
                                    id="logo-upload"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    onChange={handleLogoUpload}
                                />
                                {logoPreview ? (
                                    <div className="space-y-4 text-center">
                                        <div className="w-24 h-24 mx-auto rounded-xl p-2 bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <p className="text-sm font-bold text-violet-600">Logo Disiapkan</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center text-2xl mx-auto shadow-inner group-hover/upload:scale-110 transition-transform">
                                            <FaUpload />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Klik untuk mengunggah logo</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG (Maks. 2MB). Rekomendasi rasio 1:1.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                Logo yang diunggah akan disematkan secara otomatis di titik tengah pada *QR Code* absensi atau *microsite* yang di-generate melalui *Event Builder*.
                            </p>
                        </div>

                        <div className="pt-6 mt-auto">
                            <button onClick={handleLogoSave} className="w-full py-4 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-violet-500/30 active:scale-95 flex items-center justify-center gap-2">
                                <FaSave /> Simpan Preferensi Visual
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

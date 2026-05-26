"use client";

import { useState, useEffect, useMemo } from "react";
import { kelasOptions } from "@/lib/kelas";
import { safeJson } from "@/lib/safeFetch";
import { LandingNavbar } from "@/app/components/landing/Navbar";
import { HeroSection } from "@/app/components/landing/Hero";
import { RegisterDialog } from "@/app/components/landing/RegisterDialog";
import { CheckNisDialog } from "@/app/components/landing/CheckNisDialog";
import { ConfirmOverlay } from "@/app/components/landing/ConfirmOverlay";
import type { NisResult } from "@/app/components/landing/types";

export default function Home() {
  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ nama: "", nis: "", kelas: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check NIS modal
  const [showCheckNis, setShowCheckNis] = useState(false);
  const [checkNis, setCheckNis] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkMsg, setCheckMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [nisResults, setNisResults] = useState<NisResult[]>([]);

  // Download APK URL
  const [downloadApkUrl, setDownloadApkUrl] = useState("");

  // Handle APK download with redirect
  const handleDownloadApk = () => {
    if (downloadApkUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadApkUrl;
      link.download = 'examcoy.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Redirect to home after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  // Total users count
  const [totalUsers, setTotalUsers] = useState(0);

  // Duplicate NIS info
  const [dupInfo, setDupInfo] = useState<{ nis: string; nama: string; kelas: string } | null>(null);

  // Registration confirmation
  const [showConfirm, setShowConfirm] = useState(false);

  // Kelas step selector
  const [selTingkat, setSelTingkat] = useState("");
  const [selJurusan, setSelJurusan] = useState("");
  const [selNomor, setSelNomor] = useState("");

  // Derive jurusan list from selected tingkat
  const jurusanOptions = useMemo(() => {
    if (!selTingkat || !kelasOptions[selTingkat]) return [];
    const jurusans = new Map<string, string[]>();
    for (const k of kelasOptions[selTingkat]) {
      const parts = k.split(/\s+/);
      const withoutTingkat = parts.slice(1);
      const last = withoutTingkat[withoutTingkat.length - 1];
      const hasNumber = /^\d+$/.test(last) && withoutTingkat.length > 1;
      const jurusan = hasNumber ? withoutTingkat.slice(0, -1).join(" ") : withoutTingkat.join(" ");
      const nomor = hasNumber ? last : "";
      if (!jurusans.has(jurusan)) jurusans.set(jurusan, []);
      if (nomor) jurusans.get(jurusan)!.push(nomor);
    }
    return Array.from(jurusans.entries()).map(([j, nums]) => ({ jurusan: j, nomors: nums.sort() }));
  }, [selTingkat]);

  // Derive nomor options from selected jurusan
  const nomorOptions = useMemo(() => {
    const found = jurusanOptions.find((j) => j.jurusan === selJurusan);
    return found ? found.nomors : [];
  }, [jurusanOptions, selJurusan]);

  // Auto-compose kelas when selections change
  useEffect(() => {
    if (!selTingkat || !selJurusan) {
      setRegForm((f) => ({ ...f, kelas: "" }));
      return;
    }
    const found = jurusanOptions.find((j) => j.jurusan === selJurusan);
    if (!found) return;
    if (found.nomors.length === 0) {
      // Single class like "X PPLG"
      setRegForm((f) => ({ ...f, kelas: `${selTingkat} ${selJurusan}` }));
    } else if (selNomor) {
      setRegForm((f) => ({ ...f, kelas: `${selTingkat} ${selJurusan} ${selNomor}` }));
    } else {
      setRegForm((f) => ({ ...f, kelas: "" }));
    }
  }, [selTingkat, selJurusan, selNomor, jurusanOptions]);

  // Reset downstream when tingkat changes
  function handleTingkatChange(t: string) {
    setSelTingkat(t);
    setSelJurusan("");
    setSelNomor("");
  }

  // Reset nomor when jurusan changes, auto-select if single class
  function handleJurusanChange(j: string) {
    setSelJurusan(j);
    setSelNomor("");
  }

  useEffect(() => {
    // Check if APK file exists directly first
    console.log("[APK Check] Starting APK file check...");
    fetch("/api/apk-info")
      .then((r) => r.json())
      .then((d) => {
        console.log("[APK Check] Response:", d);
        if (d.exists) {
          // Automatically use the detected APK file path
          console.log("[APK Check] APK file exists, using:", d.path);
          setDownloadApkUrl(d.path);
        } else {
          // If APK doesn't exist, fetch settings for external URL
          console.log("[APK Check] APK file not found, fetching settings for external URL");
          return fetch("/exam-info")
            .then((r) => safeJson<{ url_download_apk?: string }>(r))
            .then((d) => {
              console.log("[APK Check] Settings response:", d);
              setDownloadApkUrl(d.url_download_apk || "");
            });
        }
      })
      .catch((err) => {
        console.error("[APK Check] Error checking APK:", err);
        // On error, fallback to settings
        fetch("/exam-info")
          .then((r) => safeJson<{ url_download_apk?: string }>(r))
          .then((d) => {
            console.log("[APK Check] Fallback settings:", d);
            setDownloadApkUrl(d.url_download_apk || "");
          })
          .catch(() => {});
      });

    fetchTotalUsers();
  }, []);

  function fetchTotalUsers() {
    fetch("/api/total-users")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return safeJson<{ total?: number }>(r);
      })
      .then((d) => {
        console.log("total-users response:", d);
        setTotalUsers(typeof d.total === "number" ? d.total : 0);
      })
      .catch((err) => console.error("fetchTotalUsers error:", err));
  }

  function openRegister() {
    setRegMsg(null);
    setDupInfo(null);
    setShowRegister(true);
  }

  function closeRegister() {
    setShowRegister(false);
  }

  function openCheckNis() {
    setCheckMsg(null);
    setNisResults([]);
    setShowCheckNis(true);
  }

  function closeCheckNis() {
    setShowCheckNis(false);
  }

  function handleRegisterConfirm(e: React.FormEvent) {
    e.preventDefault();
    closeRegister();
    setShowConfirm(true);
  }

  function cancelConfirm() {
    setShowConfirm(false);
    openRegister();
  }

  async function handleRegisterSubmit() {
    setShowConfirm(false);
    setRegLoading(true);
    setRegMsg(null);
    try {
      const res = await fetch("/register-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await safeJson<{ error?: string; message?: string; duplicate?: { nis: string; nama: string; kelas: string } }>(res);
      if (!res.ok) {
        if (data.duplicate) {
          setDupInfo(data.duplicate);
        }
        throw new Error(data.error || "Gagal menyimpan data.");
      }
      setDupInfo(null);
      setRegMsg({ type: "success", text: data.message || "Berhasil" });
      setRegForm({ nama: "", nis: "", kelas: "" });
      setSelTingkat(""); setSelJurusan(""); setSelNomor("");
      fetchTotalUsers();
    } catch (err: unknown) {
      setRegMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setRegLoading(false);
    }
  }

  async function handleCheckNis(e: React.FormEvent) {
    e.preventDefault();
    setCheckLoading(true);
    setCheckMsg(null);
    setNisResults([]);
    try {
      const res = await fetch("/check-nis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nis: checkNis }),
      });
      const data = await safeJson<{ error?: string; message?: string; found?: boolean; results?: NisResult[] }>(res);
      if (!res.ok) throw new Error(data.error || "Gagal mengecek NIS.");
      if (!data.found) {
        setCheckMsg({ type: "warning", text: data.message || "Tidak ditemukan" });
      } else {
        setCheckMsg({ type: "success", text: "Data Ditemukan" });
        setNisResults(data.results || []);
      }
    } catch (err: unknown) {
      setCheckMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setCheckLoading(false);
    }
  }

  return (
    <>
      <LandingNavbar />

      <HeroSection
        totalUsers={totalUsers}
        downloadApkUrl={downloadApkUrl}
        onOpenRegister={openRegister}
        onOpenCheckNis={openCheckNis}
        handleDownloadApk={handleDownloadApk}
      />

      {/* Features Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium mb-4">
              Cara Mendaftar
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Empat Langkah <span className="text-gradient-cool">Mudah</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">Ikuti langkah mudah berikut untuk mendaftarkan akun ujianmu</p>
          </div>
          <div className="relative space-y-6 lg:space-y-8 pb-20 md:pb-0">
            {/* Connecting dashed lines (desktop only) */}
            <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 500" preserveAspectRatio="none">
              <defs>
                <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="line-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              {/* Card 1 → Card 2 */}
              <path d="M 220 60 C 300 120, 360 100, 440 110" fill="none" stroke="url(#line-grad-1)" strokeWidth="2" strokeDasharray="10 7" />
              {/* Card 2 → Card 3 */}
              <path d="M 560 110 C 640 100, 700 120, 780 60" fill="none" stroke="url(#line-grad-2)" strokeWidth="2" strokeDasharray="10 7" />
              {/* Card 3 → Card 4 */}
              <path d="M 720 200 C 680 300, 580 350, 500 370" fill="none" stroke="url(#line-grad-3)" strokeWidth="2" strokeDasharray="10 7" />
            </svg>

            {/* Row 1: 3 cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="group relative rounded-2xl bg-sky-400/[0.06] backdrop-blur-xl border border-sky-400/15 p-7 hover:-translate-y-1.5 transition-all duration-500 shadow-[0_8px_30px_rgba(56,189,248,0.06)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.12)] md:mt-0">
                <div className="absolute -top-2.5 left-6 w-5 h-5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl font-extrabold text-sky-400/30">01</span>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Isi Data Diri</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Masukkan nama lengkap, NIS (5 digit), dan pilih kelas kamu dari dropdown yang tersedia.</p>
              </div>

              {/* Card 2 */}
              <div className="group relative rounded-2xl bg-cyan-400/[0.06] backdrop-blur-xl border border-cyan-400/15 p-7 hover:-translate-y-1.5 transition-all duration-500 shadow-[0_8px_30px_rgba(6,182,212,0.06)] hover:shadow-[0_8px_40px_rgba(6,182,212,0.12)] md:mt-8">
                <div className="absolute -top-2.5 left-6 w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl font-extrabold text-cyan-400/30">02</span>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Kirim Pendaftaran</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Klik tombol daftar dan data kamu akan langsung tersimpan secara otomatis ke sistem.</p>
              </div>

              {/* Card 3 */}
              <div className="group relative rounded-2xl bg-blue-400/[0.06] backdrop-blur-xl border border-blue-400/15 p-7 hover:-translate-y-1.5 transition-all duration-500 shadow-[0_8px_30px_rgba(59,130,246,0.06)] hover:shadow-[0_8px_40px_rgba(59,130,246,0.12)] md:mt-0">
                <div className="absolute -top-2.5 left-6 w-5 h-5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl font-extrabold text-blue-400/30">03</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cek Status</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Gunakan fitur Check NIS untuk memastikan data pendaftaran kamu sudah tersimpan dengan benar.</p>
              </div>
            </div>

            {/* Row 2: Card 4 centered */}
            <div className="relative z-10 flex justify-center">
              <div className="group relative rounded-2xl bg-emerald-400/[0.06] backdrop-blur-xl border border-emerald-400/15 p-7 hover:-translate-y-1.5 transition-all duration-500 shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.12)] w-full md:w-2/3 lg:w-1/2">
                <div className="absolute -top-2.5 left-6 w-5 h-5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl font-extrabold text-emerald-400/30">04</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Install APK</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">Download dan install aplikasi ExamCoy di HP kamu untuk mengikuti ujian.</p>
                {downloadApkUrl ? (
                  <button 
                    type="button"
                    onClick={handleDownloadApk}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 hover:text-emerald-200 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download APK
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                    Belum tersedia
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gray-900/60 border border-white/5 p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/logo.png" alt="ExamCoy" className="w-9 h-9 rounded-xl object-contain" />
                  <span className="text-xl font-bold tracking-tight">Exam<span className="text-gradient-cool">Coy</span></span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                  Satu Pintu, Menuju Gerbang Ujian SMK Negeri 1 Dukuhturi. Daftarkan akun ujianmu dengan standar keamanan tinggi dan integrasi penuh ke sistem sekolah. Kami memastikan data kamu aman, prosesnya cepat, dan kamu siap fokus sepenuhnya pada prestasi.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Halaman</h4>
                <ul className="space-y-2.5">
                  <li><a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Beranda</a></li>
                  <li><a href="/siswa" className="text-sm text-gray-400 hover:text-white transition-colors">Data Siswa</a></li>
                  <li><a href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Admin</a></li>
                </ul>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} ExamCoy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      <RegisterDialog
        open={showRegister}
        loading={regLoading}
        message={regMsg}
        dupInfo={dupInfo}
        regForm={regForm}
        selTingkat={selTingkat}
        selJurusan={selJurusan}
        selNomor={selNomor}
        jurusanOptions={jurusanOptions}
        nomorOptions={nomorOptions}
        onChangeForm={setRegForm}
        onChangeTingkat={handleTingkatChange}
        onChangeJurusan={handleJurusanChange}
        onChangeNomor={setSelNomor}
        onClose={closeRegister}
        onSubmitConfirm={handleRegisterConfirm}
      />

      <ConfirmOverlay open={showConfirm} regForm={regForm} onCancel={cancelConfirm} onConfirm={handleRegisterSubmit} />

      <CheckNisDialog
        open={showCheckNis}
        loading={checkLoading}
        message={checkMsg}
        results={nisResults}
        nis={checkNis}
        onChangeNis={setCheckNis}
        onClose={closeCheckNis}
        onSubmit={handleCheckNis}
      />
    </>
  );
}

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { kelasOptions } from "@/lib/kelas";
import { safeJson } from "@/lib/safeFetch";
import ThemeToggle from "@/app/components/ThemeToggle";

type NisResult = { nama: string; nis: string; kelas: string };

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

  // Dialog refs
  const registerDialogRef = useRef<HTMLDialogElement>(null);
  const checkNisDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetch("/exam-info")
      .then((r) => safeJson<{ url_download_apk?: string }>(r))
      .then((d) => setDownloadApkUrl(d.url_download_apk || ""))
      .catch(() => {});
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
    registerDialogRef.current?.showModal();
  }

  function closeRegister() {
    setShowRegister(false);
    registerDialogRef.current?.close();
  }

  function openCheckNis() {
    setCheckMsg(null);
    setNisResults([]);
    setShowCheckNis(true);
    checkNisDialogRef.current?.showModal();
  }

  function closeCheckNis() {
    setShowCheckNis(false);
    checkNisDialogRef.current?.close();
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
      {/* ===== DESKTOP NAVBAR — floating pill, hidden on mobile ===== */}
      <nav className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-surface flex items-center gap-1 px-2 py-2 rounded-full bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30">
          <a href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500/15 text-sky-300 text-sm font-semibold transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            Beranda
          </a>
          <a href="/siswa" className="lm-muted px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
            Data Siswa
          </a>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ===== MOBILE TOP BAR — logo only, hidden on desktop ===== */}
      <div className="nav-surface md:hidden sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ExamCoy" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight">Exam<span className="text-gradient-cool">Coy</span></span>
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* ===== MOBILE BOTTOM BAR — fixed, hidden on desktop ===== */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-surface flex items-center gap-1 px-3 py-2.5 rounded-[20px] bg-gray-800/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <a href="/" className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl bg-sky-500/10 border border-sky-400/20 shadow-[0_0_12px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            <span className="text-[10px] font-semibold text-sky-300">Beranda</span>
          </a>
          <a href="/siswa" className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl hover:bg-white/5 transition-all">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-medium text-gray-500">Data Siswa</span>
          </a>
        </div>
      </div>

      {/* Hero Section - Split Layout */}
      <section className="relative min-h-screen flex items-center pb-32 md:pb-0 overflow-x-hidden">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-blue-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-20 right-1/3 w-[250px] h-[250px] bg-sky-400/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 w-full py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div className="animate-slide-left text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Portal Pendaftaran Aktif
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1]">
                <span className="text-white">Daftarkan</span><br />
                <span className="text-white">Akun </span>
                <span className="text-gradient-cool">Ujian</span><br />
                <span className="text-gradient-cool">Kamu</span>
              </h1>

              {/* Mobile-only visual — between title and description */}
              <div className="lg:hidden relative mt-8 mb-2">
                <div className="relative w-full aspect-square max-w-[300px] sm:max-w-[360px] mx-auto">
                  <div className="absolute inset-4 rounded-full border border-dashed border-sky-400/20 animate-spin-slow" />
                  <div className="absolute inset-12 rounded-full border border-dashed border-cyan-400/15 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
                  <div className="absolute inset-16 rounded-full gradient-bg-cool opacity-10 animate-pulse-glow" />
                  <div className="absolute inset-8 rounded-full bg-gray-950/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                    <img src="/pelajar.png" alt="Pelajar" className="w-full h-full object-contain animate-breathe" />
                  </div>
                  {/* Floating Cards */}
                  <div className="absolute -top-2 right-2 animate-float-slow">
                    <div className="glass-card rounded-2xl p-3 shadow-xl shadow-sky-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Status</div>
                          <div className="text-xs font-semibold text-emerald-400">Aktif</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/4 -left-1 animate-float-reverse">
                    <div className="glass-card rounded-2xl p-3 shadow-xl shadow-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Terdaftar</div>
                          <div className="text-xs font-bold text-gradient-cool">{totalUsers}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-0 animate-float">
                    <div className="glass-card rounded-2xl p-3 shadow-xl shadow-blue-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Proses</div>
                          <div className="text-xs font-semibold text-blue-400">Cepat</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1/4 -left-1 animate-float-slow" style={{ animationDelay: '2s' }}>
                    <div className="glass-card rounded-2xl p-3 shadow-xl shadow-teal-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Data</div>
                          <div className="text-xs font-semibold text-teal-400">Aman</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-10 left-1/3 w-2.5 h-2.5 rounded-full bg-sky-500/40 animate-pulse" />
                  <div className="absolute bottom-14 right-1/3 w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </div>

              <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed mx-auto lg:mx-0">
                Satu Pintu, Menuju Gerbang Ujian SMK Negeri 1 Dukuhturi. Daftarkan akun ujianmu dengan standar keamanan tinggi dan integrasi penuh ke sistem sekolah.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button type="button" onClick={openRegister} style={{ touchAction: 'manipulation' }} className="px-8 py-4 text-base font-semibold rounded-2xl gradient-bg-cool text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-300">
                  Buat Akun Exam
                </button>
                <button type="button" onClick={openCheckNis} style={{ touchAction: 'manipulation' }} className="px-8 py-4 text-base font-semibold rounded-2xl border-2 border-white/10 text-gray-300 hover:border-sky-400/50 hover:text-white hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-300">
                  Cek Status NIS
                </button>
              </div>

              {/* Download APK */}
              {downloadApkUrl && (
                <div className="mt-5 flex justify-center lg:justify-start">
                  <a href={downloadApkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 hover:text-emerald-200 transition-all duration-300 hover:-translate-y-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download APK
                  </a>
                </div>
              )}

              {/* Inline Stats */}
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 sm:gap-10">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-gradient-cool">{totalUsers.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-0.5">User Terdaftar</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white">45+</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Kelas Tersedia</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white">3</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Tingkat</div>
                </div>
              </div>
            </div>

            {/* Right - Visual / Decorative Illustration (desktop only) */}
            <div className="hidden lg:block relative animate-slide-right">
              {/* Main Circle */}
              <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] mx-auto">
                {/* Rotating ring */}
                <div className="absolute inset-4 rounded-full border border-dashed border-sky-400/20 animate-spin-slow" />
                <div className="absolute inset-12 rounded-full border border-dashed border-cyan-400/15 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

                {/* Central Glow */}
                <div className="absolute inset-16 rounded-full gradient-bg-cool opacity-10 animate-pulse-glow" />
                <div className="absolute inset-8 rounded-full bg-gray-950/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img src="/pelajar.png" alt="Pelajar" className="w-full h-full object-contain animate-breathe" />
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-2 right-2 sm:right-8 animate-float-slow">
                  <div className="glass-card rounded-2xl p-4 shadow-xl shadow-sky-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <div className="text-sm font-semibold text-emerald-400">Aktif</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/4 -left-2 sm:-left-6 animate-float-reverse">
                  <div className="glass-card rounded-2xl p-4 shadow-xl shadow-cyan-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Terdaftar</div>
                        <div className="text-sm font-bold text-gradient-cool">{totalUsers}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 right-0 sm:-right-2 animate-float">
                  <div className="glass-card rounded-2xl p-4 shadow-xl shadow-blue-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Proses</div>
                        <div className="text-sm font-semibold text-blue-400">Cepat</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1/4 -left-2 sm:-left-10 animate-float-slow" style={{ animationDelay: '2s' }}>
                  <div className="glass-card rounded-2xl p-4 shadow-xl shadow-teal-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Data</div>
                        <div className="text-sm font-semibold text-teal-400">Aman</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Small decorative dots */}
                <div className="absolute top-10 left-1/3 w-3 h-3 rounded-full bg-sky-500/40 animate-pulse" />
                <div className="absolute bottom-16 right-1/3 w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-4 w-2.5 h-2.5 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  <a href={downloadApkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 hover:text-emerald-200 transition-all duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download APK
                  </a>
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

      {/* ============ DIALOG: Register ============ */}
      <dialog ref={registerDialogRef} onClick={(e) => { if (e.target === registerDialogRef.current) closeRegister(); }} className="modal-dialog">
        <div className="w-full max-w-lg glass-card glow-border rounded-2xl p-6 sm:p-8 relative mx-auto">
          <button type="button" onClick={closeRegister} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl gradient-bg-cool flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Buat Akun Exam</h2>
            <p className="text-gray-400 text-sm mt-1">Isi formulir di bawah untuk mendaftarkan akun ujianmu</p>
          </div>

          {regMsg && (
            <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 ${regMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
              {regMsg.type === "success" ? (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {regMsg.text}
            </div>
          )}

          {dupInfo && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-2">
              <p className="text-amber-300 font-medium">Data yang sudah terdaftar:</p>
              <div className="space-y-1 text-gray-300">
                <div className="flex justify-between"><span className="text-gray-400">NIS</span><span className="text-white font-medium">{dupInfo.nis}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Nama</span><span className="text-white font-medium">{dupInfo.nama}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Kelas</span><span className="text-white font-medium">{dupInfo.kelas}</span></div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterConfirm} className="space-y-5">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap</label>
              <input type="text" id="nama" value={regForm.nama} onChange={(e) => setRegForm({ ...regForm, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500" required />
            </div>
            <div>
              <label htmlFor="nis" className="block text-sm font-medium text-gray-300 mb-2">NIS (5 Digit)</label>
              <input type="text" id="nis" value={regForm.nis} onChange={(e) => setRegForm({ ...regForm, nis: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} placeholder="Contoh: 12345" maxLength={5} inputMode="numeric" className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500" required />
            </div>
            {/* Kelas Step Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Kelas</label>

              {/* Step 1: Tingkat */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat</span>
                <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {["X", "XI", "XII"].map((t) => (
                    <button type="button" key={t} onClick={() => handleTingkatChange(t)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selTingkat === t ? "bg-sky-600 text-white shadow-md shadow-sky-500/30" : "text-gray-400 hover:text-white"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Step 2: Jurusan — slide in */}
              {selTingkat && jurusanOptions.length > 0 && (
                <div className="animate-slideDown">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Jurusan</span>
                  <div className="flex flex-wrap gap-1.5">
                    {jurusanOptions.map(({ jurusan }) => (
                      <button type="button" key={jurusan} onClick={() => handleJurusanChange(jurusan)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${selJurusan === jurusan ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"}`}
                      >{jurusan}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Nomor Kelas — slide in, only if multiple */}
              {selJurusan && nomorOptions.length > 0 && (
                <div className="animate-slideDown">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nomor Kelas</span>
                  <div className="flex gap-1.5">
                    {nomorOptions.map((n) => (
                      <button type="button" key={n} onClick={() => setSelNomor(n)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${selNomor === n ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-purple-500/30"}`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result preview */}
              {regForm.kelas && (
                <div className="flex items-center gap-2 pt-1">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm text-emerald-300 font-medium">{regForm.kelas}</span>
                </div>
              )}

              {/* Hidden required input for form validation */}
              <input type="text" value={regForm.kelas} required className="sr-only" tabIndex={-1} onChange={() => {}} />
            </div>
            <button type="submit" disabled={regLoading} className="w-full py-3.5 rounded-xl gradient-bg-cool text-white font-semibold disabled:opacity-50 cursor-pointer">
              {regLoading ? "Menyimpan..." : "Daftarkan Akun"}
            </button>
          </form>
        </div>
      </dialog>

      {/* ============ CONFIRM REGISTRATION POPUP ============ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cancelConfirm}>
          <div className="w-full max-w-sm glass-card glow-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Konfirmasi Pendaftaran</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Pastikan data berikut sudah benar:</p>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Nama</span>
                <span className="text-sm text-white font-medium text-right max-w-[60%] truncate">{regForm.nama}</span>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">NIS</span>
                <span className="text-sm text-sky-300 font-mono font-medium">{regForm.nis}</span>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Kelas</span>
                <span className="text-sm text-emerald-300 font-medium">{regForm.kelas}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={cancelConfirm} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
                Batal
              </button>
              <button onClick={handleRegisterSubmit} className="flex-1 py-2.5 rounded-xl gradient-bg-cool text-white text-sm font-semibold transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40">
                Ya, Daftarkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DIALOG: Check NIS ============ */}
      <dialog ref={checkNisDialogRef} onClick={(e) => { if (e.target === checkNisDialogRef.current) closeCheckNis(); }} className="modal-dialog">
        <div className="w-full max-w-lg glass-card glow-border rounded-2xl p-6 sm:p-8 relative mx-auto">
          <button type="button" onClick={closeCheckNis} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Check NIS</h2>
            <p className="text-gray-400 text-sm mt-1">Masukkan NIS untuk mengecek status pendaftaran</p>
          </div>

          {checkMsg && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
              checkMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" :
              checkMsg.type === "warning" ? "bg-amber-500/10 border border-amber-500/20 text-amber-300" :
              "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={checkMsg.type === "success" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"} /></svg>
              {checkMsg.text}
            </div>
          )}

          {nisResults.length > 0 && (
            <div className="mb-6 space-y-3">
              {nisResults.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">Nama</span><span className="text-white text-sm font-medium">{r.nama}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">NIS</span><span className="text-white text-sm font-medium">{r.nis}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">Kelas</span><span className="text-white text-sm font-medium">{r.kelas}</span></div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCheckNis} className="space-y-5">
            <div>
              <label htmlFor="check_nis" className="block text-sm font-medium text-gray-300 mb-2">NIS (5 Digit)</label>
              <input type="text" id="check_nis" value={checkNis} onChange={(e) => setCheckNis(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} placeholder="Masukkan NIS kamu" maxLength={5} inputMode="numeric" className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500" required />
            </div>
            <button type="submit" disabled={checkLoading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold disabled:opacity-50 cursor-pointer">
              {checkLoading ? "Mengecek..." : "Cek NIS"}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

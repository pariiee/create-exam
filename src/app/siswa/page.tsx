"use client";

import { safeJson } from "@/lib/safeFetch";
import ThemeToggle from "@/app/components/ThemeToggle";

import { useState, useEffect, useMemo } from "react";

type Student = { no: string; nis: string; nama: string; kelas: string; sheet: string };

const SHEETS = ["KELAS X", "KELAS XI", "KELAS XII"];
const TINGKAT = ["X", "XI", "XII"];

function extractJurusan(kelas: string): string {
  // "X RPL" → "RPL", "XI TKJ 1" → "TKJ", "XII AK 2" → "AK"
  const parts = kelas.trim().split(/\s+/);
  if (parts.length < 2) return "";
  // Remove tingkat prefix (X/XI/XII) and trailing number
  const withoutTingkat = parts.slice(1);
  const last = withoutTingkat[withoutTingkat.length - 1];
  if (/^\d+$/.test(last) && withoutTingkat.length > 1) {
    return withoutTingkat.slice(0, -1).join(" ");
  }
  return withoutTingkat.join(" ");
}

function extractTingkat(kelas: string): string {
  const k = kelas.trim();
  if (k.startsWith("XII")) return "XII";
  if (k.startsWith("XI")) return "XI";
  if (k.startsWith("X")) return "X";
  return "";
}

export default function SiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("ALL");
  const [filterJurusan, setFilterJurusan] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const allStudents: Student[] = [];
        for (const sheet of SHEETS) {
          const res = await fetch(`/siswa/api?sheet=${encodeURIComponent(sheet)}`);
          const data = await safeJson<{ rows?: string[][] }>(res);
          if (data.rows) {
            for (const row of data.rows) {
              allStudents.push({
                no: row[0] ?? "",
                nis: row[1] ?? "",
                nama: row[2] ?? "",
                kelas: row[3] ?? "",
                sheet,
              });
            }
          }
        }
        setStudents(allStudents);
      } catch {
        setError("Gagal memuat data siswa.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Get unique jurusan list from data, filtered by selected tingkat
  const jurusanList = useMemo(() => {
    let pool = students;
    if (filterTingkat !== "ALL") {
      pool = pool.filter((s) => extractTingkat(s.kelas) === filterTingkat);
    }
    const set = new Set<string>();
    for (const s of pool) {
      const j = extractJurusan(s.kelas);
      if (j) set.add(j);
    }
    return Array.from(set).sort();
  }, [students, filterTingkat]);

  // Reset jurusan filter when tingkat changes and jurusan not available
  useEffect(() => {
    if (filterJurusan !== "ALL" && !jurusanList.includes(filterJurusan)) {
      setFilterJurusan("ALL");
    }
  }, [jurusanList, filterJurusan]);

  const filtered = useMemo(() => {
    let result = students;
    if (filterTingkat !== "ALL") {
      result = result.filter((s) => extractTingkat(s.kelas) === filterTingkat);
    }
    if (filterJurusan !== "ALL") {
      result = result.filter((s) => extractJurusan(s.kelas) === filterJurusan);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.nis.toLowerCase().includes(q) ||
          s.nama.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const nisA = parseInt(a.nis, 10) || 0;
      const nisB = parseInt(b.nis, 10) || 0;
      return nisA - nisB;
    });
  }, [students, filterTingkat, filterJurusan, search]);

  const countPerTingkat = useMemo(() => {
    const counts: Record<string, number> = { ALL: students.length };
    for (const t of TINGKAT) {
      counts[t] = students.filter((s) => extractTingkat(s.kelas) === t).length;
    }
    return counts;
  }, [students]);

  const countPerJurusan = useMemo(() => {
    let pool = students;
    if (filterTingkat !== "ALL") {
      pool = pool.filter((s) => extractTingkat(s.kelas) === filterTingkat);
    }
    const counts: Record<string, number> = { ALL: pool.length };
    for (const j of jurusanList) {
      counts[j] = pool.filter((s) => extractJurusan(s.kelas) === j).length;
    }
    return counts;
  }, [students, filterTingkat, jurusanList]);

  return (
    <div className="min-h-screen">
      {/* ===== DESKTOP NAVBAR — floating pill, hidden on mobile ===== */}
      <nav className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-surface flex items-center gap-1 px-2 py-2 rounded-full bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30">
          <a href="/" className="lm-muted px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
            Beranda
          </a>
          <a href="/siswa" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500/15 text-sky-300 text-sm font-semibold transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
          <a href="/" className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl hover:bg-white/5 transition-all">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            <span className="text-[10px] font-medium text-gray-500">Beranda</span>
          </a>
          <a href="/siswa" className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl bg-sky-500/10 border border-sky-400/20 shadow-[0_0_12px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-semibold text-sky-300">Data Siswa</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8">
        {/* Header - CENTERED */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Data Siswa Terdaftar</h1>
          <p className="text-gray-400 mt-2">Daftar seluruh siswa yang sudah mendaftar akun ujian.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Total: {students.length} siswa terdaftar
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 mb-4 space-y-3">
          {/* Row 1: Tingkat segmented + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Segmented Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {["ALL", ...TINGKAT].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTingkat(t)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    filterTingkat === t
                      ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "Semua" : t}
                  <span className={`ml-1.5 text-xs tabular-nums ${
                    filterTingkat === t ? "text-sky-200" : "text-gray-500"
                  }`}>
                    {countPerTingkat[t] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs ml-auto">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIS atau nama..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-sky-500/50 transition-all duration-200"
              />
            </div>
          </div>

          {/* Row 2: Jurusan chips — slide in when tingkat selected */}
          {jurusanList.length > 0 && filterTingkat !== "ALL" && (
            <div className="overflow-hidden animate-slideDown">
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0 mr-1">Jurusan</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setFilterJurusan("ALL")}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterJurusan === "ALL"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                        : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"
                    }`}
                  >
                    Semua <span className="text-[10px] ml-1 opacity-70">{countPerJurusan["ALL"] ?? 0}</span>
                  </button>
                  {jurusanList.map((j) => (
                    <button
                      key={j}
                      onClick={() => setFilterJurusan(j)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterJurusan === j
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                          : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"
                      }`}
                    >
                      {j} <span className="text-[10px] ml-1 opacity-70">{countPerJurusan[j] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active filter badge */}
        {(filterTingkat !== "ALL" || filterJurusan !== "ALL" || search.trim()) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500">Menampilkan:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterTingkat !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-medium">
                  Kelas {filterTingkat}
                  <button onClick={() => setFilterTingkat("ALL")} className="ml-0.5 hover:text-white transition-colors">&times;</button>
                </span>
              )}
              {filterJurusan !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-medium">
                  {filterJurusan}
                  <button onClick={() => setFilterJurusan("ALL")} className="ml-0.5 hover:text-white transition-colors">&times;</button>
                </span>
              )}
              {search.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-medium">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch("")} className="ml-0.5 hover:text-white transition-colors">&times;</button>
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 font-medium">&middot; {filtered.length} siswa</span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Memuat data siswa...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        ) : (
          <>
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-gray-500">Tidak ada data ditemukan.</div>
            ) : (
              filtered.map((s, i) => (
                <div key={`${s.sheet}-${s.nis}-${i}`} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono w-6 shrink-0 text-center">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{s.nama}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sky-400 text-xs">{s.nis}</span>
                      <span className="text-gray-600">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">{s.kelas}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {filtered.length > 0 && (
              <div className="text-center text-xs text-gray-500 py-2">
                Menampilkan {filtered.length} dari {students.length} siswa
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">NO</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">NIS</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">NAMA</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">KELAS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s, i) => (
                      <tr key={`${s.sheet}-${s.nis}-${i}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-6 py-3 text-sky-300 font-mono">{s.nis}</td>
                        <td className="px-6 py-3 text-white">{s.nama}</td>
                        <td className="px-6 py-3">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
                            {s.kelas}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Table footer count */}
            <div className="px-6 py-4 border-t border-white/5 text-center">
              <span className="text-sm text-gray-400">
                Menampilkan <span className="text-white font-medium">{filtered.length}</span> dari <span className="text-white font-medium">{students.length}</span> siswa
              </span>
            </div>
          </div>
          </>
        )}
      </div>

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
    </div>
  );
}

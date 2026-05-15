"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { kelasOptions } from "@/lib/kelas";
import { safeJson } from "@/lib/safeFetch";

type Student = { no: string; nis: string; nama: string; kelas: string; sheet: string };

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Settings state
  const [pinOut, setPinOut] = useState("");
  const [urlUjian, setUrlUjian] = useState("");
  const [urlDownloadApk, setUrlDownloadApk] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fetchingSettings, setFetchingSettings] = useState(false);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ nama: "", nis: "", kelas: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [studentMsg, setStudentMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminTab, setAdminTab] = useState<"settings" | "students" | "api">("settings");

  // Edit kelas step selector
  const [editTingkat, setEditTingkat] = useState("");
  const [editJurusan, setEditJurusan] = useState("");
  const [editNomor, setEditNomor] = useState("");

  const editJurusanOptions = useMemo(() => {
    if (!editTingkat || !kelasOptions[editTingkat]) return [];
    const jurusans = new Map<string, string[]>();
    for (const k of kelasOptions[editTingkat]) {
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
  }, [editTingkat]);

  const editNomorOptions = useMemo(() => {
    const found = editJurusanOptions.find((j) => j.jurusan === editJurusan);
    return found ? found.nomors : [];
  }, [editJurusanOptions, editJurusan]);

  useEffect(() => {
    if (!editTingkat || !editJurusan) {
      setEditForm((f) => ({ ...f, kelas: "" }));
      return;
    }
    const found = editJurusanOptions.find((j) => j.jurusan === editJurusan);
    if (!found) return;
    if (found.nomors.length === 0) {
      setEditForm((f) => ({ ...f, kelas: `${editTingkat} ${editJurusan}` }));
    } else if (editNomor) {
      setEditForm((f) => ({ ...f, kelas: `${editTingkat} ${editJurusan} ${editNomor}` }));
    } else {
      setEditForm((f) => ({ ...f, kelas: "" }));
    }
  }, [editTingkat, editJurusan, editNomor, editJurusanOptions]);

  const fetchSettings = useCallback(async (authToken: string) => {
    setFetchingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await safeJson(res);
      if (res.ok && data.settings) {
        setPinOut(data.settings.pin_out || "");
        setUrlUjian(data.settings.url_ujian || "");
        setUrlDownloadApk(data.settings.url_download_apk || "");
      }
    } catch {
      // Settings sheet might not exist yet, that's ok
    } finally {
      setFetchingSettings(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      fetchSettings(saved);
    }
  }, [fetchSettings]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Login gagal.");
      setToken(data.token);
      sessionStorage.setItem("admin_token", data.token);
      fetchSettings(data.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin_out: pinOut, url_ujian: urlUjian, url_download_apk: urlDownloadApk }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setSettingsMsg({ type: "success", text: data.message });
    } catch (err: unknown) {
      setSettingsMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setSettingsLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setPassword("");
    sessionStorage.removeItem("admin_token");
  }

  const fetchStudents = useCallback(async (authToken: string) => {
    setStudentsLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await safeJson(res);
      if (res.ok && data.students) {
        setStudents(data.students);
      }
    } catch {
      // ignore
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  async function handleDeleteStudent() {
    if (!deleteConfirm || !token) return;
    setDeleteLoading(true);
    setStudentMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nis: deleteConfirm.nis, sheet: deleteConfirm.sheet }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Gagal menghapus.");
      setStudentMsg({ type: "success", text: data.message });
      setDeleteConfirm(null);
      fetchStudents(token);
    } catch (err: unknown) {
      setStudentMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent || !token) return;
    setEditLoading(true);
    setStudentMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          oldNis: editStudent.nis,
          oldSheet: editStudent.sheet,
          nama: editForm.nama,
          nis: editForm.nis,
          kelas: editForm.kelas,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setStudentMsg({ type: "success", text: data.message });
      setEditStudent(null);
      fetchStudents(token);
    } catch (err: unknown) {
      setStudentMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setEditLoading(false);
    }
  }

  function openEdit(s: Student) {
    setEditForm({ nama: s.nama, nis: s.nis, kelas: s.kelas });
    // Parse existing kelas into tingkat/jurusan/nomor
    const parts = s.kelas.split(/\s+/);
    const tingkat = parts[0] || "";
    const rest = parts.slice(1);
    const last = rest[rest.length - 1];
    const hasNumber = /^\d+$/.test(last) && rest.length > 1;
    const jurusan = hasNumber ? rest.slice(0, -1).join(" ") : rest.join(" ");
    const nomor = hasNumber ? last : "";
    setEditTingkat(tingkat);
    setEditJurusan(jurusan);
    setEditNomor(nomor);
    setEditStudent(s);
  }

  function handleEditTingkatChange(t: string) {
    setEditTingkat(t);
    setEditJurusan("");
    setEditNomor("");
  }

  function handleEditJurusanChange(j: string) {
    setEditJurusan(j);
    setEditNomor("");
  }

  const filteredStudents = useMemo(() => {
    let result = students;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      result = result.filter(
        (s) => s.nis.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (parseInt(a.nis, 10) || 0) - (parseInt(b.nis, 10) || 0));
  }, [students, studentSearch]);

  // Load students when tab changes to students
  useEffect(() => {
    if (adminTab === "students" && token && students.length === 0) {
      fetchStudents(token);
    }
  }, [adminTab, token, students.length, fetchStudents]);

  // ==================== LOGIN SCREEN ====================
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-fade-in w-full max-w-sm glass-card glow-border rounded-2xl p-8">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-gray-400 text-sm mt-1">Masukkan password admin untuk melanjutkan</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="admin_password" className="block text-sm font-medium text-gray-300 mb-2">Password Admin</label>
              <input
                type="password"
                id="admin_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading || !password}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              &larr; Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  return (
    <div className="min-h-screen">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">Admin<span className="gradient-text">Panel</span></span>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 hover:border-indigo-500/50 text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/5">
                Beranda
              </a>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-300 hover:text-red-200 transition-all duration-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          <button onClick={() => setAdminTab("settings")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${adminTab === "settings" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>
            Pengaturan
          </button>
          <button onClick={() => setAdminTab("students")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${adminTab === "students" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>
            Data Siswa
          </button>
          <button onClick={() => setAdminTab("api")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${adminTab === "api" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>
            API Docs
          </button>
        </div>
      </div>

      {/* ==================== TAB: SETTINGS ==================== */}
      {adminTab === "settings" && (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Pengaturan Ujian</h1>
          <p className="text-gray-400 mt-2">Atur pengaturan ujian untuk siswa.</p>
        </div>

        {fetchingSettings ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Memuat pengaturan...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {settingsMsg && (
              <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${settingsMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
                {settingsMsg.type === "success" ? (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                {settingsMsg.text}
              </div>
            )}

            {/* PIN Out */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">PIN Out</h3>
                  <p className="text-gray-400 text-sm">PIN 5 digit untuk siswa keluar dari ujian</p>
                </div>
              </div>
              <input
                type="text"
                value={pinOut}
                onChange={(e) => setPinOut(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="Contoh: 12345"
                maxLength={5}
                inputMode="numeric"
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all duration-200 text-lg tracking-widest"
              />
            </div>

            {/* URL Ujian */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">URL Ujian</h3>
                  <p className="text-gray-400 text-sm">Link menuju halaman ujian untuk siswa</p>
                </div>
              </div>
              <input
                type="url"
                value={urlUjian}
                onChange={(e) => setUrlUjian(e.target.value)}
                placeholder="https://exam.example.com/ujian"
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all duration-200"
              />
            </div>

            {/* URL Download APK */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">URL Download APK</h3>
                  <p className="text-gray-400 text-sm">Link download APK untuk tombol di landing page</p>
                </div>
              </div>
              <input
                type="url"
                value={urlDownloadApk}
                onChange={(e) => setUrlDownloadApk(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={settingsLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {settingsLoading ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </form>
        )}
      </div>
      )}

      {/* ==================== TAB: DATA SISWA ==================== */}
      {adminTab === "students" && (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Siswa Terdaftar</h1>
            <p className="text-gray-400 mt-1">Kelola data siswa yang sudah mendaftar. Total: <span className="text-white font-medium">{students.length}</span> siswa</p>
          </div>
          <button onClick={() => token && fetchStudents(token)} disabled={studentsLoading} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:text-indigo-200 text-sm font-medium transition-all disabled:opacity-50">
            <svg className={`w-4 h-4 ${studentsLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {studentMsg && (
          <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 ${studentMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
            {studentMsg.type === "success" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {studentMsg.text}
            <button onClick={() => setStudentMsg(null)} className="ml-auto text-current hover:opacity-70">&times;</button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Cari NIS, nama, atau kelas..."
            className="w-full sm:w-80 pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-200"
          />
        </div>

        {studentsLoading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Memuat data siswa...</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-4 px-4 sm:px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">NIS</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kelas</th>
                    <th className="text-right py-4 px-4 sm:px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-500">Tidak ada data siswa.</td></tr>
                  ) : (
                    filteredStudents.map((s, i) => (
                      <tr key={`${s.nis}-${s.sheet}-${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 sm:px-6 font-mono text-sky-300">{s.nis}</td>
                        <td className="py-3 px-4 sm:px-6 text-white">{s.nama}</td>
                        <td className="py-3 px-4 sm:px-6">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs">{s.kelas}</span>
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-xs font-medium transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredStudents.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-t border-white/5 text-xs text-gray-500">
                Menampilkan {filteredStudents.length} dari {students.length} siswa
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ==================== TAB: API DOCS ==================== */}
      {adminTab === "api" && (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">API Documentation</h1>
          <p className="text-gray-400 mt-1">Endpoint yang tersedia untuk integrasi.</p>
        </div>

        <div className="space-y-4">
          {/* PAGE /siswa */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-wider">PAGE</span>
              <code className="text-white font-mono text-sm">/siswa</code>
            </div>
            <p className="text-gray-400 text-sm mb-3">Halaman publik data siswa. Tabel NIS, Nama, Kelas dengan filter per kelas dan jumlah siswa.</p>
            <a href="/siswa" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:text-indigo-200 text-sm font-medium transition-all">
              Buka /siswa &rarr;
            </a>
          </div>

          {/* GET /v1.0/ujian */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider">GET</span>
              <code className="text-white font-mono text-sm">/v1.0/ujian</code>
            </div>
            <p className="text-gray-400 text-sm mb-3">Endpoint utama info ujian. Mengembalikan PIN out dan URL ujian saja.</p>
            <div className="bg-black/30 rounded-xl p-4 font-mono text-sm mb-3">
              <div className="text-gray-500 mb-2">// Response</div>
              <div className="text-gray-300">{"{}"[0]}</div>
              <div className="text-gray-300 pl-4">&quot;pin_out&quot;: <span className="text-amber-400">&quot;{pinOut || "12345"}&quot;</span>,</div>
              <div className="text-gray-300 pl-4">&quot;url_ujian&quot;: <span className="text-cyan-400">&quot;{urlUjian || "https://..."}&quot;</span></div>
              <div className="text-gray-300">{"{}"[1]}</div>
            </div>
            <a href="/v1.0/ujian" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:text-indigo-200 text-sm font-medium transition-all">
              Test /v1.0/ujian &rarr;
            </a>
          </div>

          {/* GET /exam-info */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-wider">GET</span>
              <code className="text-white font-mono text-sm">/exam-info</code>
            </div>
            <p className="text-gray-400 text-sm mb-3">Endpoint publik. Mengembalikan URL ujian dan URL download APK.</p>
            <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
              <div className="text-gray-500 mb-2">// Response</div>
              <div className="text-gray-300">{"{"}</div>
              <div className="text-gray-300 pl-4">&quot;url_ujian&quot;: <span className="text-cyan-400">&quot;{urlUjian || "https://..."}&quot;</span>,</div>
              <div className="text-gray-300 pl-4">&quot;url_download_apk&quot;: <span className="text-emerald-400">&quot;{urlDownloadApk || "https://..."}&quot;</span></div>
              <div className="text-gray-300">{"}"}</div>
            </div>
          </div>

          {/* POST /register-exam */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider">POST</span>
              <code className="text-white font-mono text-sm">/register-exam</code>
            </div>
            <p className="text-gray-400 text-sm mb-3">Mendaftarkan akun ujian baru ke Google Sheets.</p>
            <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
              <div className="text-gray-500 mb-2">// Request Body</div>
              <div className="text-gray-300">{"{"} &quot;nama&quot;: <span className="text-green-400">&quot;string&quot;</span>, &quot;nis&quot;: <span className="text-green-400">&quot;5 digit&quot;</span>, &quot;kelas&quot;: <span className="text-green-400">&quot;string&quot;</span> {"}"}</div>
            </div>
          </div>

          {/* POST /check-nis */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider">POST</span>
              <code className="text-white font-mono text-sm">/check-nis</code>
            </div>
            <p className="text-gray-400 text-sm mb-3">Cek NIS siswa di semua sheet (KELAS X/XI/XII).</p>
            <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
              <div className="text-gray-500 mb-2">// Request Body</div>
              <div className="text-gray-300">{"{"} &quot;nis&quot;: <span className="text-green-400">&quot;5 digit&quot;</span> {"}"}</div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditStudent(null)}>
          <div className="w-full max-w-md glass-card glow-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Edit Data Siswa</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama</label>
                <input type="text" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">NIS</label>
                <input type="text" value={editForm.nis} onChange={(e) => setEditForm({ ...editForm, nis: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} maxLength={5} inputMode="numeric" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm" required />
              </div>
              {/* Kelas Step Selector */}
              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-gray-300">Kelas</label>
                <div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Tingkat</span>
                  <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {["X", "XI", "XII"].map((t) => (
                      <button type="button" key={t} onClick={() => handleEditTingkatChange(t)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${editTingkat === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {editTingkat && editJurusanOptions.length > 0 && (
                  <div className="animate-slideDown">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Jurusan</span>
                    <div className="flex flex-wrap gap-1.5">
                      {editJurusanOptions.map(({ jurusan }) => (
                        <button type="button" key={jurusan} onClick={() => handleEditJurusanChange(jurusan)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${editJurusan === jurusan ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"}`}>{jurusan}</button>
                      ))}
                    </div>
                  </div>
                )}
                {editJurusan && editNomorOptions.length > 0 && (
                  <div className="animate-slideDown">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Nomor Kelas</span>
                    <div className="flex gap-1.5">
                      {editNomorOptions.map((n) => (
                        <button type="button" key={n} onClick={() => setEditNomor(n)} className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200 ${editNomor === n ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-purple-500/30"}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                )}
                {editForm.kelas && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs text-emerald-300 font-medium">{editForm.kelas}</span>
                  </div>
                )}
                <input type="text" value={editForm.kelas} required className="sr-only" tabIndex={-1} onChange={() => {}} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditStudent(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
                  Batal
                </button>
                <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold transition-all disabled:opacity-50">
                  {editLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm glass-card glow-border rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hapus Siswa?</h3>
            <p className="text-gray-400 text-sm mb-1">Yakin ingin menghapus data siswa:</p>
            <p className="text-white font-medium mb-1">{deleteConfirm.nama}</p>
            <p className="text-gray-400 text-sm mb-6">NIS: {deleteConfirm.nis} &middot; {deleteConfirm.kelas}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
                Batal
              </button>
              <button onClick={handleDeleteStudent} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                {deleteLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

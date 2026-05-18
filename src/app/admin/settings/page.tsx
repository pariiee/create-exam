"use client";

import { useState, useEffect, useCallback } from "react";
import { settingToBoolean } from "@/lib/settings";

export default function AdminSettingsPage() {
  const [pinOut, setPinOut] = useState("");
  const [pinOutEnabled, setPinOutEnabled] = useState(true);
  const [urlUjian, setUrlUjian] = useState("");
  const [urlDownloadApk, setUrlDownloadApk] = useState("");
  const [sesi1Mulai, setSesi1Mulai] = useState("07:30");
  const [sesi1Selesai, setSesi1Selesai] = useState("09:30");
  const [sesi2Mulai, setSesi2Mulai] = useState("10:00");
  const [sesi2Selesai, setSesi2Selesai] = useState("12:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getToken = () => sessionStorage.getItem("admin_token") || "";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        setPinOut(s.pin_out || "");
        setPinOutEnabled(settingToBoolean(s.pin_out_enabled, true));
        setUrlUjian(s.url_ujian || "");
        setUrlDownloadApk(s.url_download_apk || "");
        setSesi1Mulai(s.SESI_1_MULAI || "07:30");
        setSesi1Selesai(s.SESI_1_SELESAI || "09:30");
        setSesi2Mulai(s.SESI_2_MULAI || "10:00");
        setSesi2Selesai(s.SESI_2_SELESAI || "12:00");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          pin_out: pinOut,
          pin_out_enabled: pinOutEnabled,
          url_ujian: urlUjian,
          url_download_apk: urlDownloadApk,
          sesi_1_mulai: sesi1Mulai,
          sesi_1_selesai: sesi1Selesai,
          sesi_2_mulai: sesi2Mulai,
          sesi_2_selesai: sesi2Selesai,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setMsg({ type: "success", text: "Semua pengaturan berhasil disimpan!" });
      // Refresh data dari server untuk memastikan sync
      setTimeout(() => fetchSettings(), 500);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Semua pengaturan ujian dalam satu halaman</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {msg && (
          <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${msg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msg.type === "success" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            {msg.text}
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
          <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <p className="text-sm font-semibold text-white">PIN OUT Aktif</p>
              <p className="text-xs text-gray-400 mt-0.5">{pinOutEnabled ? "Siswa wajib input PIN OUT saat selesai ujian" : "Siswa langsung selesai tanpa PIN OUT"}</p>
            </div>
            <button
              type="button"
              onClick={() => setPinOutEnabled(!pinOutEnabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pinOutEnabled ? "bg-amber-500" : "bg-white/10"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  pinOutEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Jadwal Sesi Ujian</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Sesi 1 */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-sm">S1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sesi 1</h3>
              <p className="text-gray-400 text-sm">Waktu mulai dan selesai sesi 1</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mulai</label>
              <input type="time" value={sesi1Mulai} onChange={(e) => setSesi1Mulai(e.target.value)} className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input type="time" value={sesi1Selesai} onChange={(e) => setSesi1Selesai(e.target.value)} className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {/* Sesi 2 */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <span className="text-purple-400 font-bold text-sm">S2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sesi 2</h3>
              <p className="text-gray-400 text-sm">Waktu mulai dan selesai sesi 2</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mulai</label>
              <input type="time" value={sesi2Mulai} onChange={(e) => setSesi2Mulai(e.target.value)} className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input type="time" value={sesi2Selesai} onChange={(e) => setSesi2Selesai(e.target.value)} className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl p-4 bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-xs text-indigo-300">Sesi aktif ditentukan otomatis berdasarkan jam saat ini. Jika jam sekarang berada dalam rentang sesi 1 atau sesi 2, maka sesi tersebut yang aktif.</p>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
        </button>
      </form>
    </div>
  );
}

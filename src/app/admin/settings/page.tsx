"use client";

import { useState, useEffect, useCallback } from "react";

type SettingsState = {
  pin_out: string;
  pin_out_enabled: boolean;
  url_ujian: string;
  url_download_apk: string;
  sesi_1_mulai: string;
  sesi_1_selesai: string;
  sesi_2_mulai: string;
  sesi_2_selesai: string;
};

export default function AdminSettingsPage() {
  // Separate saved state (from server) and form state (local changes)
  const [savedSettings, setSavedSettings] = useState<SettingsState | null>(null);
  const [formSettings, setFormSettings] = useState<SettingsState>({
    pin_out: "",
    pin_out_enabled: true,
    url_ujian: "",
    url_download_apk: "",
    sesi_1_mulai: "07:30",
    sesi_1_selesai: "09:30",
    sesi_2_mulai: "10:00",
    sesi_2_selesai: "12:00",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [togglingPin, setTogglingPin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getToken = () => sessionStorage.getItem("admin_token") || "";

  // Helper function to parse pin_out_enabled
  const parsePinOutEnabled = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (value === null || value === undefined || value === "") return true;
    const str = String(value).toLowerCase().trim();
    return str === "true" || str === "1" || str === "on" || str === "yes";
  };

  // Fetch settings from server
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.warn("[Fetch] Token not found");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const s = data.settings || {};

      console.log("[Fetch] Server settings:", s);

      const newSettings: SettingsState = {
        pin_out: s.pin_out || "",
        pin_out_enabled: parsePinOutEnabled(s.pin_out_enabled),
        url_ujian: s.url_ujian || "",
        url_download_apk: s.url_download_apk || "",
        sesi_1_mulai: s.SESI_1_MULAI || "07:30",
        sesi_1_selesai: s.SESI_1_SELESAI || "09:30",
        sesi_2_mulai: s.SESI_2_MULAI || "10:00",
        sesi_2_selesai: s.SESI_2_SELESAI || "12:00",
      };

      setSavedSettings(newSettings);
      setFormSettings(newSettings);
      console.log("[Fetch] State updated, pin_out_enabled =", newSettings.pin_out_enabled);
    } catch (err) {
      console.error("[Fetch] Error:", err);
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal memuat" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-save PIN toggle
  async function togglePinEnabled() {
    const newValue = !formSettings.pin_out_enabled;
    setFormSettings({ ...formSettings, pin_out_enabled: newValue });
    setTogglingPin(true);
    setMsg(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Token tidak ditemukan");

      const base = savedSettings || formSettings;
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pin_out: base.pin_out,
          pin_out_enabled: newValue,
          url_ujian: base.url_ujian,
          url_download_apk: base.url_download_apk,
          sesi_1_mulai: base.sesi_1_mulai,
          sesi_1_selesai: base.sesi_1_selesai,
          sesi_2_mulai: base.sesi_2_mulai,
          sesi_2_selesai: base.sesi_2_selesai,
        }),
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Gagal menyimpan");

      const data = await res.json();
      if (data.settings) {
        const newSettings: SettingsState = {
          pin_out: data.settings.pin_out || "",
          pin_out_enabled: parsePinOutEnabled(data.settings.pin_out_enabled),
          url_ujian: data.settings.url_ujian || "",
          url_download_apk: data.settings.url_download_apk || "",
          sesi_1_mulai: data.settings.SESI_1_MULAI || "07:30",
          sesi_1_selesai: data.settings.SESI_1_SELESAI || "09:30",
          sesi_2_mulai: data.settings.SESI_2_MULAI || "10:00",
          sesi_2_selesai: data.settings.SESI_2_SELESAI || "12:00",
        };
        setSavedSettings(newSettings);
        setFormSettings((prev) => ({ ...prev, pin_out_enabled: newSettings.pin_out_enabled }));
      }

      setMsg({ type: "success", text: newValue ? "\u2713 PIN OUT diaktifkan" : "\u2713 PIN OUT dinonaktifkan" });
    } catch (err) {
      setFormSettings((prev) => ({ ...prev, pin_out_enabled: !newValue }));
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan toggle" });
    } finally {
      setTogglingPin(false);
    }
  }

  // Handle save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Token tidak ditemukan");

      console.log("[Save] Sending settings:", formSettings);

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pin_out: formSettings.pin_out,
          pin_out_enabled: formSettings.pin_out_enabled,
          url_ujian: formSettings.url_ujian,
          url_download_apk: formSettings.url_download_apk,
          sesi_1_mulai: formSettings.sesi_1_mulai,
          sesi_1_selesai: formSettings.sesi_1_selesai,
          sesi_2_mulai: formSettings.sesi_2_mulai,
          sesi_2_selesai: formSettings.sesi_2_selesai,
        }),
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
        return;
      }
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menyimpan");
      }

      const data = await res.json();
      console.log("[Save] Server response:", data);

      if (data.settings) {
        const newSettings: SettingsState = {
          pin_out: data.settings.pin_out || "",
          pin_out_enabled: parsePinOutEnabled(data.settings.pin_out_enabled),
          url_ujian: data.settings.url_ujian || "",
          url_download_apk: data.settings.url_download_apk || "",
          sesi_1_mulai: data.settings.SESI_1_MULAI || "07:30",
          sesi_1_selesai: data.settings.SESI_1_SELESAI || "09:30",
          sesi_2_mulai: data.settings.SESI_2_MULAI || "10:00",
          sesi_2_selesai: data.settings.SESI_2_SELESAI || "12:00",
        };

        setSavedSettings(newSettings);
        setFormSettings(newSettings);
        console.log("[Save] Settings synchronized, pin_out_enabled =", newSettings.pin_out_enabled);
      }

      setMsg({ type: "success", text: "✓ Pengaturan berhasil disimpan!" });
    } catch (err) {
      console.error("[Save] Error:", err);
      setMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleApkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".apk")) {
      setUploadMsg({ type: "error", text: "Format file harus .apk!" });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Token tidak ditemukan");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-apk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah file");

      setUploadMsg({ type: "success", text: "File APK berhasil diunggah!" });
      
      // Update local settings so UI updates
      setFormSettings(prev => ({ ...prev, url_download_apk: data.url || "/app.apk" }));
      setSavedSettings(prev => prev ? { ...prev, url_download_apk: data.url || "/app.apk" } : null);
    } catch (err) {
      console.error("[Upload APK Error]", err);
      setUploadMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal mengunggah" });
    } finally {
      setUploading(false);
      e.target.value = "";
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
        {/* Message */}
        {msg && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
              msg.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  msg.type === "success"
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              />
            </svg>
            {msg.text}
          </div>
        )}

        {/* PIN Out */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">PIN Out</h3>
              <p className="text-gray-400 text-sm">PIN 5 digit untuk siswa keluar dari ujian</p>
            </div>
          </div>

          <input
            type="text"
            value={formSettings.pin_out}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
              setFormSettings({ ...formSettings, pin_out: value });
            }}
            placeholder="Contoh: 12345"
            maxLength={5}
            inputMode="numeric"
            className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all duration-200 text-lg tracking-widest"
          />

          {/* Toggle */}
          <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <p className="text-sm font-semibold text-white">PIN OUT Aktif</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formSettings.pin_out_enabled
                  ? "Siswa wajib input PIN OUT saat selesai ujian"
                  : "Siswa langsung selesai tanpa PIN OUT"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {togglingPin && (
                <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
              )}
              <button
                type="button"
                disabled={togglingPin}
                onClick={togglePinEnabled}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  formSettings.pin_out_enabled ? "bg-amber-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    formSettings.pin_out_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
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
            value={formSettings.url_ujian}
            onChange={(e) => setFormSettings({ ...formSettings, url_ujian: e.target.value })}
            placeholder="https://exam.example.com/ujian"
            className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all duration-200"
          />
        </div>

        {/* Upload File APK */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Upload APK Aplikasi</h3>
              <p className="text-gray-400 text-sm">Upload file APK ujian agar user bisa langsung download dari web</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Status APK Saat Ini */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-400">Status File:</p>
                <div className="text-white font-medium mt-0.5 max-w-[280px] sm:max-w-[400px] truncate">
                  {formSettings.url_download_apk === "/app.apk" 
                    ? "✓ File APK tersedia di server" 
                    : formSettings.url_download_apk 
                    ? `✓ Menggunakan link: ${formSettings.url_download_apk}`
                    : "✕ Belum ada file APK yang di-upload"}
                </div>
              </div>
              {formSettings.url_download_apk && (
                <a 
                  href={formSettings.url_download_apk} 
                  download="examcoy.apk"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shrink-0"
                >
                  Coba Download
                </a>
              )}
            </div>

            {/* Input File Dropzone/Button */}
            <div className="relative">
              <input
                type="file"
                accept=".apk"
                onChange={handleApkUpload}
                disabled={uploading}
                id="apk-file-input"
                className="hidden"
              />
              <label
                htmlFor="apk-file-input"
                className={`flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  uploading 
                    ? "border-emerald-500/30 bg-emerald-500/5 cursor-not-allowed" 
                    : "border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  {uploading ? (
                    <>
                      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
                      <p className="text-sm font-semibold text-emerald-300">Mengunggah file APK...</p>
                      <p className="text-xs text-gray-400 mt-1">Harap tunggu hingga proses selesai</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-semibold text-white">Klik untuk memilih file APK</p>
                      <p className="text-xs text-gray-400 mt-1">Hanya menerima file .apk</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Upload Message */}
            {uploadMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  uploadMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}
              >
                <span>{uploadMsg.text}</span>
              </div>
            )}
          </div>
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
              <input
                type="time"
                value={formSettings.sesi_1_mulai}
                onChange={(e) => setFormSettings({ ...formSettings, sesi_1_mulai: e.target.value })}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input
                type="time"
                value={formSettings.sesi_1_selesai}
                onChange={(e) => setFormSettings({ ...formSettings, sesi_1_selesai: e.target.value })}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 [color-scheme:dark]"
              />
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
              <input
                type="time"
                value={formSettings.sesi_2_mulai}
                onChange={(e) => setFormSettings({ ...formSettings, sesi_2_mulai: e.target.value })}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input
                type="time"
                value={formSettings.sesi_2_selesai}
                onChange={(e) => setFormSettings({ ...formSettings, sesi_2_selesai: e.target.value })}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl p-4 bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-xs text-indigo-300">Sesi aktif ditentukan otomatis berdasarkan jam saat ini. Jika jam sekarang berada dalam rentang sesi 1 atau sesi 2, maka sesi tersebut yang aktif.</p>
        </div>

        {/* Save Button */}
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
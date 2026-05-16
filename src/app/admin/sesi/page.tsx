"use client";

import { useState, useEffect, useCallback } from "react";

type SesiInfo = {
  nomor: number;
  mulai: string;
  selesai: string;
  status: string;
};

type SesiData = {
  tanggal_ujian: string;
  sesi_aktif: number;
  sesi: SesiInfo[];
  boleh_masuk: boolean;
  pesan: string;
};

export default function SesiPage() {
  const [sesi1Mulai, setSesi1Mulai] = useState("07:30");
  const [sesi1Selesai, setSesi1Selesai] = useState("09:30");
  const [sesi2Mulai, setSesi2Mulai] = useState("10:00");
  const [sesi2Selesai, setSesi2Selesai] = useState("12:00");
  const [sesiAktif, setSesiAktif] = useState(1);
  const [tanggalUjian, setTanggalUjian] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sesiData, setSesiData] = useState<SesiData | null>(null);
  const [countdown, setCountdown] = useState("");

  const getToken = () => sessionStorage.getItem("admin_token") || "";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, sesiRes] = await Promise.all([
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch("/v1.0/sesi-ujian"),
      ]);

      if (settingsRes.ok) {
        const d = await settingsRes.json();
        const s = d.settings || {};
        setSesi1Mulai(s.SESI_1_MULAI || "07:30");
        setSesi1Selesai(s.SESI_1_SELESAI || "09:30");
        setSesi2Mulai(s.SESI_2_MULAI || "10:00");
        setSesi2Selesai(s.SESI_2_SELESAI || "12:00");
        setSesiAktif(parseInt(s.SESI_AKTIF || "1", 10));
        setTanggalUjian(s.TANGGAL_UJIAN || "");
      }

      if (sesiRes.ok) {
        setSesiData(await sesiRes.json());
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

  // Countdown timer
  useEffect(() => {
    if (!sesiData) return;
    const activeSesi = sesiData.sesi.find((s) => s.nomor === sesiData.sesi_aktif);
    if (!activeSesi) return;

    const tick = () => {
      const now = new Date();
      const jakartaOffset = 7 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const jakarta = new Date(utcMs + jakartaOffset * 60000);
      const [eh, em] = activeSesi.selesai.split(":").map(Number);
      const endMs = new Date(jakarta).setHours(eh, em, 0, 0);
      const diff = endMs - jakarta.getTime();

      if (diff <= 0) {
        setCountdown("Sesi selesai");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [sesiData]);

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
          sesi_1_mulai: sesi1Mulai,
          sesi_1_selesai: sesi1Selesai,
          sesi_2_mulai: sesi2Mulai,
          sesi_2_selesai: sesi2Selesai,
          sesi_aktif: sesiAktif,
          tanggal_ujian: tanggalUjian,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setMsg({ type: "success", text: "Sesi ujian berhasil disimpan!" });
      // Refresh sesi data
      const sesiRes = await fetch("/v1.0/sesi-ujian");
      if (sesiRes.ok) setSesiData(await sesiRes.json());
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
          <p className="text-gray-400">Memuat data sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Sesi Ujian</h1>
        <p className="text-gray-400 mt-1">Atur jadwal dan sesi ujian</p>
      </div>

      {/* Live Status */}
      {sesiData && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Status Real-time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {sesiData.sesi.map((s) => (
              <div key={s.nomor} className={`rounded-xl p-4 border ${s.status === "aktif" ? "bg-emerald-500/5 border-emerald-500/20" : s.status === "selesai" ? "bg-gray-500/5 border-white/5" : "bg-white/[0.02] border-white/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Sesi {s.nomor}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    s.status === "aktif" ? "bg-emerald-500/20 text-emerald-400" :
                    s.status === "selesai" ? "bg-gray-500/20 text-gray-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {s.status === "aktif" ? "Aktif" : s.status === "selesai" ? "Selesai" : "Belum Mulai"}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-gray-300">{s.mulai} - {s.selesai}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{sesiData.pesan}</p>
            {countdown && countdown !== "Sesi selesai" && (
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sisa Waktu</p>
                <p className="text-2xl font-mono font-bold text-indigo-400">{countdown}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {msg && (
          <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${msg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msg.type === "success" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            {msg.text}
          </div>
        )}

        {/* Tanggal Ujian */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tanggal Ujian</h3>
              <p className="text-gray-400 text-sm">Pilih tanggal pelaksanaan ujian</p>
            </div>
          </div>
          <input
            type="date"
            value={tanggalUjian}
            onChange={(e) => setTanggalUjian(e.target.value)}
            className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-500 transition-all duration-200 [color-scheme:dark]"
          />
        </div>

        {/* Sesi 1 */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-sm">S1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sesi 1</h3>
              <p className="text-gray-400 text-sm">Atur waktu mulai dan selesai sesi 1</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mulai</label>
              <input
                type="time"
                value={sesi1Mulai}
                onChange={(e) => setSesi1Mulai(e.target.value)}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input
                type="time"
                value={sesi1Selesai}
                onChange={(e) => setSesi1Selesai(e.target.value)}
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
              <p className="text-gray-400 text-sm">Atur waktu mulai dan selesai sesi 2</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mulai</label>
              <input
                type="time"
                value={sesi2Mulai}
                onChange={(e) => setSesi2Mulai(e.target.value)}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selesai</label>
              <input
                type="time"
                value={sesi2Selesai}
                onChange={(e) => setSesi2Selesai(e.target.value)}
                className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Sesi Aktif */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sesi Aktif</h3>
              <p className="text-gray-400 text-sm">Pilih sesi yang sedang berlangsung</p>
            </div>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSesiAktif(1)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${sesiAktif === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}
            >
              Sesi 1
            </button>
            <button
              type="button"
              onClick={() => setSesiAktif(2)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${sesiAktif === 2 ? "bg-purple-600 text-white shadow-md shadow-purple-500/30" : "text-gray-400 hover:text-white"}`}
            >
              Sesi 2
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan..." : "Simpan ke Google Sheet"}
        </button>
      </form>
    </div>
  );
}

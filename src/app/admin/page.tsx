"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

type PelanggaranItem = {
  timestamp: string;
  nis: string;
  nama: string;
  kelas: string;
  sesi: number;
  jenis: string;
  alasan: string;
  foto_url: string;
  status: string;
};

export default function AdminPage() {
  const [totalSiswa, setTotalSiswa] = useState<number | null>(null);
  const [sesiData, setSesiData] = useState<SesiData | null>(null);
  const [pelanggaranToday, setPelanggaranToday] = useState<PelanggaranItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => sessionStorage.getItem("admin_token") || "";

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, sesiRes, pelanggaranRes] = await Promise.all([
        fetch("/api/admin/students", { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch("/v1.0/sesi-ujian"),
        fetch(`/v1.0/pelanggaran?tanggal=${new Date().toISOString().slice(0, 10)}`),
      ]);

      if (studentsRes.ok) {
        const d = await studentsRes.json();
        setTotalSiswa(d.students?.length ?? 0);
      }
      if (sesiRes.ok) {
        const d = await sesiRes.json();
        setSesiData(d);
      }
      if (pelanggaranRes.ok) {
        const d = await pelanggaranRes.json();
        setPelanggaranToday(d.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Countdown timer
  const [countdown, setCountdown] = useState("");
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

  const pelanggaranSesi1 = pelanggaranToday.filter((p) => p.sesi === 1).length;
  const pelanggaranSesi2 = pelanggaranToday.filter((p) => p.sesi === 2).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview status ujian hari ini</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Siswa */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Siswa</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalSiswa ?? "-"}</p>
          <p className="text-xs text-gray-500 mt-1">Siswa terdaftar</p>
        </div>

        {/* Sesi Aktif */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sesi Aktif</span>
          </div>
          <p className="text-3xl font-bold text-white">Sesi {sesiData?.sesi_aktif ?? "-"}</p>
          {countdown && (
            <p className="text-xs text-indigo-400 mt-1 font-mono">{countdown}</p>
          )}
        </div>

        {/* Pelanggaran Hari Ini */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pelanggaran</span>
          </div>
          <p className="text-3xl font-bold text-white">{pelanggaranToday.length}</p>
          <p className="text-xs text-gray-500 mt-1">S1: {pelanggaranSesi1} | S2: {pelanggaranSesi2}</p>
        </div>

        {/* Status Ujian */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sesiData?.boleh_masuk ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
              <svg className={`w-5 h-5 ${sesiData?.boleh_masuk ? "text-emerald-400" : "text-amber-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sesiData?.boleh_masuk ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
          </div>
          <p className={`text-lg font-bold ${sesiData?.boleh_masuk ? "text-emerald-400" : "text-amber-400"}`}>
            {sesiData?.boleh_masuk ? "Ujian Aktif" : "Tidak Aktif"}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sesiData?.pesan || "-"}</p>
        </div>
      </div>

      {/* Sesi Info */}
      {sesiData && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Jadwal Sesi Ujian</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <p className="text-xs text-gray-500 mt-3">Tanggal ujian: {sesiData.tanggal_ujian || "(belum diatur)"}</p>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/sesi" className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Kelola Sesi</p>
              <p className="text-xs text-gray-500">Atur jadwal sesi ujian</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/pelanggaran" className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Pelanggaran</p>
              <p className="text-xs text-gray-500">Lihat rekap pelanggaran</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/settings" className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Settings</p>
              <p className="text-xs text-gray-500">PIN, URL, dan pengaturan lainnya</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const PAGE_SIZE = 20;

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

const JENIS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  KELUAR_APP: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", label: "Keluar App" },
  OVERLAY_TERDETEKSI: { bg: "bg-purple-500/15 border-purple-500/30", text: "text-purple-400", label: "Overlay" },
  UNPIN_UJIAN: { bg: "bg-purple-500/15 border-purple-500/30", text: "text-purple-400", label: "Unpin" },
  SPLIT_SCREEN: { bg: "bg-orange-500/15 border-orange-500/30", text: "text-orange-400", label: "Split Screen" },
};

function formatTime(ts: string): string {
  if (!ts) return "-";
  const t = ts.split("T")[1];
  return t ? t.slice(0, 5) : ts;
}

export default function PelanggaranPage() {
  const [data, setData] = useState<PelanggaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSesi, setFilterSesi] = useState<string>("all");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterTanggal, setFilterTanggal] = useState(() => {
    const now = new Date();
    const jakartaMs = now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 60 * 60000;
    return new Date(jakartaMs).toISOString().slice(0, 10);
  });
  const [search, setSearch] = useState("");
  const [selectedNis, setSelectedNis] = useState<string | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [sesiAktif, setSesiAktif] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const prevDataCountRef = useRef<number>(0);
  const prevDataKeysRef = useRef<Set<string>>(new Set());
  const notifPermissionRef = useRef<NotificationPermission>("default");
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const requestNotifPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    notifPermissionRef.current = permission;
    setNotifPermission(permission);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      notifPermissionRef.current = Notification.permission;
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!showExport) return;
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExport]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTanggal) params.set("tanggal", filterTanggal);
      const res = await fetch(`/v1.0/pelanggaran?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        const newData: PelanggaranItem[] = d.data || [];

        // Detect new violations for notification
        if (silent && newData.length > prevDataCountRef.current) {
          const newItems = newData.filter(
            (item) => !prevDataKeysRef.current.has(`${item.timestamp}-${item.nis}`)
          );
          newItems.forEach((item) => {
            if (notifPermissionRef.current === "granted" && "Notification" in window) {
              const badge = JENIS_BADGE[item.jenis];
              new Notification("⚠️ Pelanggaran Baru!", {
                body: `${item.nama} (${item.kelas}) — ${badge?.label ?? item.jenis}`,
                icon: "/favicon.ico",
              });
            }
          });
        }

        prevDataCountRef.current = newData.length;
        prevDataKeysRef.current = new Set(newData.map((item) => `${item.timestamp}-${item.nis}`));
        setError(null);
        setData(newData);
      } else {
        if (!silent) setError("Gagal memuat data. Periksa koneksi atau coba refresh.");
      }
    } catch {
      if (!silent) setError("Gagal memuat data. Periksa koneksi atau coba refresh.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filterTanggal]);

  // Check sesi aktif for auto-refresh decision
  useEffect(() => {
    const checkSesi = async () => {
      try {
        const res = await fetch("/v1.0/sesi-ujian");
        if (res.ok) {
          const d = await res.json();
          setSesiAktif(d.boleh_masuk === true);
        }
      } catch {
        // ignore
      }
    };
    checkSesi();
    const iv = setInterval(checkSesi, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    prevDataCountRef.current = 0;
    prevDataKeysRef.current = new Set();
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => { if (!document.hidden) fetchData(true); }, 30000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchData]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSesi, filterJenis, filterKelas, filterTanggal, search]);

  const kelasList = useMemo(() => {
    const set = new Set(data.map((d) => d.kelas));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;
    if (filterSesi !== "all") result = result.filter((d) => d.sesi === parseInt(filterSesi, 10));
    if (filterJenis === "OVERLAY_UNPIN_SPLIT") {
      result = result.filter((d) => d.jenis === "OVERLAY_TERDETEKSI" || d.jenis === "UNPIN_UJIAN" || d.jenis === "SPLIT_SCREEN");
    } else if (filterJenis !== "all") {
      result = result.filter((d) => d.jenis === filterJenis);
    }
    if (filterKelas !== "all") result = result.filter((d) => d.kelas === filterKelas);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.nis.toLowerCase().includes(q) || d.nama.toLowerCase().includes(q));
    }
    return result;
  }, [data, filterSesi, filterJenis, filterKelas, search]);

  const detailData = useMemo(() => {
    if (!selectedNis) return [];
    return data.filter((d) => d.nis === selectedNis);
  }, [data, selectedNis]);

  // Summary counts
  const sesi1Count = useMemo(() => data.filter((d) => d.sesi === 1).length, [data]);
  const sesi2Count = useMemo(() => data.filter((d) => d.sesi === 2).length, [data]);
  const jenisCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data) {
      map[d.jenis] = (map[d.jenis] || 0) + 1;
    }
    return map;
  }, [data]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  function csvField(val: string | number | undefined | null): string {
    return `"${String(val ?? "").replace(/"/g, '""')}"`;
  }

  function exportCSV(sesiOverride?: number) {
    const exportData = sesiOverride
      ? data.filter((d) => d.sesi === sesiOverride)
      : filtered;
    const sesiLabel = sesiOverride ? `_sesi${sesiOverride}` : filterSesi !== "all" ? `_sesi${filterSesi}` : "";
    const headers = ["No", "Waktu", "NIS", "Nama", "Kelas", "Sesi", "Jenis", "Alasan", "Status"];
    const rows = exportData.map((d, i) => [
      i + 1,
      csvField(d.timestamp),
      csvField(d.nis),
      csvField(d.nama),
      csvField(d.kelas),
      d.sesi,
      csvField(d.jenis),
      csvField(d.alasan),
      csvField(d.status),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pelanggaran_${filterTanggal || "all"}${sesiLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Memuat data pelanggaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Rekap Pelanggaran</h1>
          <p className="text-gray-400 mt-1">
            Data pelanggaran siswa saat ujian
            {sesiAktif && <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />Sesi berlangsung</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Notification button */}
          {"Notification" in (typeof window !== "undefined" ? window : {}) && notifPermission !== "granted" && (
            <button
              onClick={requestNotifPermission}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 text-sm font-medium transition-all"
              title="Aktifkan notifikasi pelanggaran baru"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Notifikasi
            </button>
          )}
          {notifPermission === "granted" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Notif Aktif
            </span>
          )}
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${autoRefresh ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
            title={autoRefresh ? "Auto-refresh aktif (30 detik)" : "Aktifkan auto-refresh"}
          >
            <svg className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={autoRefresh ? { animationDuration: "3s" } : {}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </button>
          <button onClick={() => fetchData()} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
              <svg className={`w-3 h-3 transition-transform ${showExport ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 w-44 glass-card rounded-xl border border-white/10 shadow-xl z-10">
                <button onClick={() => { exportCSV(); setShowExport(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl transition-colors">Filter saat ini</button>
                <button onClick={() => { exportCSV(1); setShowExport(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">Sesi 1 saja</button>
                <button onClick={() => { exportCSV(2); setShowExport(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-b-xl transition-colors">Sesi 2 saja</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:text-red-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{data.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Sesi 1</p>
          <p className="text-2xl font-bold text-indigo-400">{sesi1Count}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Sesi 2</p>
          <p className="text-2xl font-bold text-purple-400">{sesi2Count}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">Keluar App</p>
          <p className="text-2xl font-bold text-red-400">{jenisCount["KELUAR_APP"] || 0}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Overlay / Unpin / Split</p>
          <p className="text-2xl font-bold text-purple-400">{(jenisCount["OVERLAY_TERDETEKSI"] || 0) + (jenisCount["UNPIN_UJIAN"] || 0) + (jenisCount["SPLIT_SCREEN"] || 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sesi</label>
            <select
              value={filterSesi}
              onChange={(e) => setFilterSesi(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all" className="bg-gray-900">Semua Sesi</option>
              <option value="1" className="bg-gray-900">Sesi 1</option>
              <option value="2" className="bg-gray-900">Sesi 2</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jenis</label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all" className="bg-gray-900">Semua Jenis</option>
              <option value="KELUAR_APP" className="bg-gray-900">Keluar App</option>
              <option value="OVERLAY_UNPIN_SPLIT" className="bg-gray-900">Overlay / Unpin / Split</option>
              <option value="OVERLAY_TERDETEKSI" className="bg-gray-900">Overlay</option>
              <option value="UNPIN_UJIAN" className="bg-gray-900">Unpin</option>
              <option value="SPLIT_SCREEN" className="bg-gray-900">Split Screen</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kelas</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all" className="bg-gray-900">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k} value={k} className="bg-gray-900">{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cari</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="NIS atau nama..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">No</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">NIS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kelas</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sesi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Jenis</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alasan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Foto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-500">Tidak ada data pelanggaran.</td></tr>
              ) : (
                paginated.map((d, i) => {
                  const badge = JENIS_BADGE[d.jenis] || { bg: "bg-gray-500/15 border-gray-500/30", text: "text-gray-400", label: d.jenis };
                  const globalIndex = (currentPage - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr key={`${d.timestamp}-${d.nis}-${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-500">{globalIndex}</td>
                      <td className="py-3 px-4 font-mono text-gray-300 text-xs">{formatTime(d.timestamp)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedNis(d.nis)}
                          className="font-mono text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                        >
                          {d.nis}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-white">{d.nama}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs">{d.kelas}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{d.sesi}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-[200px] truncate">{d.alasan || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {d.foto_url ? (
                          <button
                            onClick={() => setPreviewFoto(d.foto_url)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs font-medium transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Lihat
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-500">
              Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} pelanggaran
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all"
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-600 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${currentPage === p ? "bg-indigo-600/30 border-indigo-500/40 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                      >{p}</button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all"
                >›</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewFoto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewFoto(null)}>
          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewFoto(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-gray-800 border border-white/10 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img
              src={previewFoto}
              alt="Bukti foto pelanggaran"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNis(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto glass-card glow-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Detail Pelanggaran</h3>
                <p className="text-sm text-gray-400">NIS: {selectedNis} {detailData[0] ? `- ${detailData[0].nama} (${detailData[0].kelas})` : ""}</p>
              </div>
              <button onClick={() => setSelectedNis(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-3">Total pelanggaran: <span className="text-white font-medium">{detailData.length}</span></p>

            <div className="space-y-3">
              {detailData.map((d, i) => {
                const badge = JENIS_BADGE[d.jenis] || { bg: "bg-gray-500/15 border-gray-500/30", text: "text-gray-400", label: d.jenis };
                return (
                  <div key={`${d.timestamp}-${i}`} className="rounded-xl p-4 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{d.timestamp.replace("T", " ")}</span>
                    </div>
                    <p className="text-sm text-gray-300">Sesi {d.sesi}</p>
                    {d.alasan && <p className="text-sm text-gray-400 mt-1">Alasan: {d.alasan}</p>}
                    {d.foto_url && (
                      <a href={d.foto_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline mt-1 inline-block">
                        Lihat Foto
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

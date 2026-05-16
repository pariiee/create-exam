"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTanggal) params.set("tanggal", filterTanggal);
      const res = await fetch(`/v1.0/pelanggaran?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterTanggal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kelasList = useMemo(() => {
    const set = new Set(data.map((d) => d.kelas));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;
    if (filterSesi !== "all") result = result.filter((d) => d.sesi === parseInt(filterSesi, 10));
    if (filterJenis !== "all") result = result.filter((d) => d.jenis === filterJenis);
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
  const sesi1Count = data.filter((d) => d.sesi === 1).length;
  const sesi2Count = data.filter((d) => d.sesi === 2).length;
  const jenisCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data) {
      map[d.jenis] = (map[d.jenis] || 0) + 1;
    }
    return map;
  }, [data]);

  function exportCSV() {
    const headers = ["No", "Waktu", "NIS", "Nama", "Kelas", "Sesi", "Jenis", "Alasan", "Status"];
    const rows = filtered.map((d, i) => [
      i + 1,
      d.timestamp,
      d.nis,
      d.nama,
      d.kelas,
      d.sesi,
      d.jenis,
      `"${(d.alasan || "").replace(/"/g, '""')}"`,
      d.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pelanggaran_${filterTanggal || "all"}.csv`;
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
          <p className="text-gray-400 mt-1">Data pelanggaran siswa saat ujian</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

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
          <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Overlay</p>
          <p className="text-2xl font-bold text-purple-400">{jenisCount["OVERLAY_TERDETEKSI"] || 0}</p>
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
              <option value="OVERLAY_TERDETEKSI" className="bg-gray-900">Overlay</option>
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-500">Tidak ada data pelanggaran.</td></tr>
              ) : (
                filtered.map((d, i) => {
                  const badge = JENIS_BADGE[d.jenis] || { bg: "bg-gray-500/15 border-gray-500/30", text: "text-gray-400", label: d.jenis };
                  return (
                    <tr key={`${d.timestamp}-${d.nis}-${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-500">{i + 1}</td>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-500">
            Menampilkan {filtered.length} dari {data.length} pelanggaran
          </div>
        )}
      </div>

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

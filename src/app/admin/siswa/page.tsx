"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { kelasOptions } from "@/lib/kelas";

type Student = { no: string; nis: string; nama: string; kelas: string; sheet: string };

export default function AdminSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ nama: "", nis: "", kelas: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add student
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ nama: "", nis: "", kelas: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addTingkat, setAddTingkat] = useState("");
  const [addJurusan, setAddJurusan] = useState("");
  const [addNomor, setAddNomor] = useState("");

  // Edit kelas step selector
  const [editTingkat, setEditTingkat] = useState("");
  const [editJurusan, setEditJurusan] = useState("");
  const [editNomor, setEditNomor] = useState("");

  const getToken = () => sessionStorage.getItem("admin_token") || "";

  // Add kelas options
  const addJurusanOptions = useMemo(() => {
    if (!addTingkat || !kelasOptions[addTingkat]) return [];
    const jurusans = new Map<string, string[]>();
    for (const k of kelasOptions[addTingkat]) {
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
  }, [addTingkat]);

  const addNomorOptions = useMemo(() => {
    const found = addJurusanOptions.find((j) => j.jurusan === addJurusan);
    return found ? found.nomors : [];
  }, [addJurusanOptions, addJurusan]);

  useEffect(() => {
    if (!addTingkat || !addJurusan) {
      setAddForm((f) => ({ ...f, kelas: "" }));
      return;
    }
    const found = addJurusanOptions.find((j) => j.jurusan === addJurusan);
    if (!found) return;
    if (found.nomors.length === 0) {
      setAddForm((f) => ({ ...f, kelas: `${addTingkat} ${addJurusan}` }));
    } else if (addNomor) {
      setAddForm((f) => ({ ...f, kelas: `${addTingkat} ${addJurusan} ${addNomor}` }));
    } else {
      setAddForm((f) => ({ ...f, kelas: "" }));
    }
  }, [addTingkat, addJurusan, addNomor, addJurusanOptions]);

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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ nama: addForm.nama, nis: addForm.nis, kelas: addForm.kelas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan.");
      setMsg({ type: "success", text: data.message });
      setShowAdd(false);
      setAddForm({ nama: "", nis: "", kelas: "" });
      setAddTingkat("");
      setAddJurusan("");
      setAddNomor("");
      fetchStudents();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ nis: deleteConfirm.nis, sheet: deleteConfirm.sheet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus.");
      setMsg({ type: "success", text: data.message });
      setDeleteConfirm(null);
      fetchStudents();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent) return;
    setEditLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          oldNis: editStudent.nis,
          oldSheet: editStudent.sheet,
          nama: editForm.nama,
          nis: editForm.nis,
          kelas: editForm.kelas,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setMsg({ type: "success", text: data.message });
      setEditStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setEditLoading(false);
    }
  }

  function openEdit(s: Student) {
    setEditForm({ nama: s.nama, nis: s.nis, kelas: s.kelas });
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

  const filteredStudents = useMemo(() => {
    let result = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.nis.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (parseInt(a.nis, 10) || 0) - (parseInt(b.nis, 10) || 0));
  }, [students, search]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Data Siswa</h1>
          <p className="text-gray-400 mt-1">Total: <span className="text-white font-medium">{students.length}</span> siswa terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowAdd(true); setAddForm({ nama: "", nis: "", kelas: "" }); setAddTingkat(""); setAddJurusan(""); setAddNomor(""); }} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Tambah Siswa
          </button>
          <button onClick={fetchStudents} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 ${msg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msg.type === "success" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto text-current hover:opacity-70">&times;</button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari NIS, nama, atau kelas..."
          className="w-full sm:w-80 pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-200"
        />
      </div>

      {/* Table */}
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
                        <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(s)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-xs font-medium transition-all">
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

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md glass-card glow-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Tambah Siswa Baru</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama</label>
                <input type="text" value={addForm.nama} onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })} placeholder="Nama lengkap" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">NIS</label>
                <input type="text" value={addForm.nis} onChange={(e) => setAddForm({ ...addForm, nis: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} maxLength={5} inputMode="numeric" placeholder="5 digit" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm" required />
              </div>
              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-gray-300">Kelas</label>
                <div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Tingkat</span>
                  <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {["X", "XI", "XII"].map((t) => (
                      <button type="button" key={t} onClick={() => { setAddTingkat(t); setAddJurusan(""); setAddNomor(""); }} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${addTingkat === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {addTingkat && addJurusanOptions.length > 0 && (
                  <div className="animate-slideDown">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Jurusan</span>
                    <div className="flex flex-wrap gap-1.5">
                      {addJurusanOptions.map(({ jurusan }) => (
                        <button type="button" key={jurusan} onClick={() => { setAddJurusan(jurusan); setAddNomor(""); }} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${addJurusan === jurusan ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"}`}>{jurusan}</button>
                      ))}
                    </div>
                  </div>
                )}
                {addJurusan && addNomorOptions.length > 0 && (
                  <div className="animate-slideDown">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Nomor Kelas</span>
                    <div className="flex gap-1.5">
                      {addNomorOptions.map((n) => (
                        <button type="button" key={n} onClick={() => setAddNomor(n)} className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200 ${addNomor === n ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-purple-500/30"}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                )}
                {addForm.kelas && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs text-emerald-300 font-medium">{addForm.kelas}</span>
                  </div>
                )}
                <input type="text" value={addForm.kelas} required className="sr-only" tabIndex={-1} onChange={() => {}} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">Batal</button>
                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold transition-all disabled:opacity-50">{addLoading ? "Menyimpan..." : "Tambah"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
                      <button type="button" key={t} onClick={() => { setEditTingkat(t); setEditJurusan(""); setEditNomor(""); }} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${editTingkat === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {editTingkat && editJurusanOptions.length > 0 && (
                  <div className="animate-slideDown">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Jurusan</span>
                    <div className="flex flex-wrap gap-1.5">
                      {editJurusanOptions.map(({ jurusan }) => (
                        <button type="button" key={jurusan} onClick={() => { setEditJurusan(jurusan); setEditNomor(""); }} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${editJurusan === jurusan ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"}`}>{jurusan}</button>
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
                <button type="button" onClick={() => setEditStudent(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">Batal</button>
                <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold transition-all disabled:opacity-50">{editLoading ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
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
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all">Batal</button>
              <button onClick={handleDeleteStudent} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50">{deleteLoading ? "Menghapus..." : "Hapus"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

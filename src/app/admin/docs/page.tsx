"use client";

import { useState } from "react";

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth?: boolean;
  queryParams?: { name: string; type: string; required: boolean; desc: string }[];
  bodyParams?: { name: string; type: string; required: boolean; desc: string }[];
  responseExample: string;
};

const endpoints: { category: string; items: Endpoint[] }[] = [
  {
    category: "Ujian & Sesi",
    items: [
      {
        method: "GET",
        path: "/v1.0/ujian",
        description:
          "Mendapatkan info ujian (PIN Out & URL Ujian). Hanya mengembalikan data jika ada sesi yang aktif berdasarkan jam saat ini. Sesi aktif ditentukan otomatis dari waktu SESI_1 dan SESI_2.",
        responseExample: JSON.stringify(
          {
            pin_out: "a1b2c3d4e5f6:encrypted_hex_string",
            url_ujian: "f6e5d4c3b2a1:encrypted_hex_string",
            sesi: 1,
            pin_out_enabled: true,
          },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/v1.0/sesi-ujian",
        description:
          "Mendapatkan status sesi ujian secara realtime. Sesi aktif ditentukan otomatis: jika jam saat ini berada dalam rentang sesi 1 atau sesi 2, maka sesi tersebut yang aktif. Mendukung lintas tengah malam (misal 23:25 - 00:00).",
        responseExample: JSON.stringify(
          {
            sesi_aktif: 1,
            sesi: [
              { nomor: 1, mulai: "07:30", selesai: "09:30", status: "aktif" },
              { nomor: 2, mulai: "10:00", selesai: "12:00", status: "tidak_aktif" },
            ],
            boleh_masuk: true,
            pesan: "Sesi 1 sedang berlangsung (07:30 - 09:30)",
          },
          null,
          2
        ),
      },
    ],
  },
  {
    category: "Report (Telegram)",
    items: [
      {
        method: "POST",
        path: "/v1.0/report",
        description:
          "Proxy laporan ke Telegram. Mengirim notifikasi ke channel Telegram saat siswa terdeteksi keluar aplikasi. Mendukung pengiriman foto (multipart/form-data).",
        bodyParams: [
          { name: "nama", type: "string", required: true, desc: "Nama siswa" },
          { name: "kelas", type: "string", required: true, desc: "Kelas siswa" },
          { name: "nis", type: "string", required: true, desc: "NIS siswa" },
          { name: "sesi", type: "string", required: true, desc: "Nomor sesi (1 atau 2)" },
          { name: "alasan", type: "string", required: true, desc: "Alasan/keterangan keluar" },
          { name: "photo", type: "file (JPEG)", required: false, desc: "Bukti foto screenshot" },
        ],
        responseExample: JSON.stringify(
          { success: true, foto_url: "https://api.telegram.org/file/bot.../photos/file.jpg" },
          null,
          2
        ),
      },
    ],
  },
  {
    category: "Pelanggaran",
    items: [
      {
        method: "POST",
        path: "/v1.0/lapor-pelanggaran",
        description: "Melaporkan pelanggaran siswa. Data akan dicatat ke Google Sheet PELANGGARAN dengan timestamp otomatis (WIB).",
        bodyParams: [
          { name: "nis", type: "string", required: true, desc: "NIS siswa (5 digit)" },
          { name: "nama", type: "string", required: true, desc: "Nama siswa" },
          { name: "kelas", type: "string", required: true, desc: "Kelas siswa" },
          { name: "sesi", type: "number", required: true, desc: "Nomor sesi (1 atau 2)" },
          { name: "jenis", type: "string", required: true, desc: "KELUAR_APP | OVERLAY_TERDETEKSI" },
          { name: "alasan", type: "string", required: false, desc: "Keterangan tambahan" },
          { name: "foto_url", type: "string", required: false, desc: "URL bukti foto" },
        ],
        responseExample: JSON.stringify(
          { success: true, message: "Pelanggaran tercatat" },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/v1.0/pelanggaran",
        description: "Mendapatkan daftar pelanggaran. Bisa difilter berdasarkan tanggal dan sesi.",
        queryParams: [
          { name: "tanggal", type: "string", required: false, desc: "Filter tanggal (YYYY-MM-DD)" },
          { name: "sesi", type: "number", required: false, desc: "Filter nomor sesi (1 atau 2)" },
        ],
        responseExample: JSON.stringify(
          {
            tanggal: "2026-05-16",
            sesi: 1,
            total_pelanggaran: 2,
            data: [
              {
                timestamp: "2026-05-16T08:15:30",
                nis: "12345",
                nama: "Budi",
                kelas: "XII RPL 1",
                sesi: 1,
                jenis: "KELUAR_APP",
                alasan: "",
                foto_url: "",
                status: "TERCATAT",
              },
            ],
          },
          null,
          2
        ),
      },
    ],
  },
  {
    category: "Registrasi & Siswa",
    items: [
      {
        method: "POST",
        path: "/register-exam",
        description: "Mendaftarkan siswa baru untuk ujian. NIS harus unik di seluruh kelas.",
        bodyParams: [
          { name: "nama", type: "string", required: true, desc: "Nama lengkap siswa" },
          { name: "nis", type: "string", required: true, desc: "NIS 5 digit" },
          { name: "kelas", type: "string", required: true, desc: "Kelas siswa (misal: XII RPL 1)" },
        ],
        responseExample: JSON.stringify(
          { success: true, message: "Akun ujian berhasil didaftarkan!" },
          null,
          2
        ),
      },
      {
        method: "POST",
        path: "/check-nis",
        description: "Mengecek apakah NIS sudah terdaftar di sistem.",
        bodyParams: [
          { name: "nis", type: "string", required: true, desc: "NIS 5 digit yang ingin dicek" },
        ],
        responseExample: JSON.stringify(
          {
            found: true,
            results: [{ nama: "Budi", nis: "12345", kelas: "XII RPL 1" }],
          },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/exam-info",
        description: "Mendapatkan URL ujian dan URL download APK (publik, tanpa auth).",
        responseExample: JSON.stringify(
          {
            url_ujian: "https://exam.example.com",
            url_download_apk: "https://drive.google.com/...",
          },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/api/total-users",
        description: "Mendapatkan total jumlah siswa yang terdaftar di semua kelas.",
        responseExample: JSON.stringify({ total: 150 }, null, 2),
      },
    ],
  },
  {
    category: "Admin",
    items: [
      {
        method: "POST",
        path: "/api/admin/login",
        description: "Login admin. Mengembalikan token untuk akses endpoint admin lainnya.",
        bodyParams: [
          { name: "password", type: "string", required: true, desc: "Password admin" },
        ],
        responseExample: JSON.stringify(
          { token: "YWRtaW46cGFzc3dvcmQ6..." },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/api/admin/settings",
        auth: true,
        description: "Mendapatkan semua pengaturan aplikasi (PIN Out, URL, jadwal sesi).",
        responseExample: JSON.stringify(
          {
            settings: {
              pin_out: "12345",
              url_ujian: "https://exam.example.com",
              url_download_apk: "https://drive.google.com/...",
              SESI_1_MULAI: "07:30",
              SESI_1_SELESAI: "09:30",
              SESI_2_MULAI: "10:00",
              SESI_2_SELESAI: "12:00",
            },
          },
          null,
          2
        ),
      },
      {
        method: "POST",
        path: "/api/admin/settings",
        auth: true,
        description: "Menyimpan pengaturan aplikasi. Field yang tidak dikirim akan tetap menggunakan nilai sebelumnya.",
        bodyParams: [
          { name: "pin_out", type: "string", required: false, desc: "PIN keluar ujian (5 digit)" },
          { name: "url_ujian", type: "string", required: false, desc: "URL halaman ujian" },
          { name: "url_download_apk", type: "string", required: false, desc: "URL download APK" },
          { name: "sesi_1_mulai", type: "string", required: false, desc: "Jam mulai sesi 1 (HH:mm)" },
          { name: "sesi_1_selesai", type: "string", required: false, desc: "Jam selesai sesi 1 (HH:mm)" },
          { name: "sesi_2_mulai", type: "string", required: false, desc: "Jam mulai sesi 2 (HH:mm)" },
          { name: "sesi_2_selesai", type: "string", required: false, desc: "Jam selesai sesi 2 (HH:mm)" },
        ],
        responseExample: JSON.stringify(
          { success: true, message: "Settings berhasil disimpan!" },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/api/admin/students",
        auth: true,
        description: "Mendapatkan semua data siswa dari seluruh kelas.",
        responseExample: JSON.stringify(
          {
            students: [
              { no: "1", nis: "12345", nama: "Budi", kelas: "XII RPL 1", sheet: "KELAS XII" },
            ],
          },
          null,
          2
        ),
      },
      {
        method: "PUT",
        path: "/api/admin/students",
        auth: true,
        description: "Update data siswa berdasarkan NIS.",
        bodyParams: [
          { name: "nis", type: "string", required: true, desc: "NIS siswa yang ingin diupdate" },
          { name: "nama", type: "string", required: true, desc: "Nama baru" },
          { name: "kelas", type: "string", required: true, desc: "Kelas baru" },
          { name: "sheet", type: "string", required: true, desc: "Sheet asal (KELAS X / KELAS XI / KELAS XII)" },
        ],
        responseExample: JSON.stringify(
          { success: true },
          null,
          2
        ),
      },
      {
        method: "DELETE",
        path: "/api/admin/students",
        auth: true,
        description: "Menghapus data siswa berdasarkan NIS.",
        bodyParams: [
          { name: "nis", type: "string", required: true, desc: "NIS siswa yang ingin dihapus" },
          { name: "sheet", type: "string", required: true, desc: "Sheet asal" },
        ],
        responseExample: JSON.stringify(
          { success: true },
          null,
          2
        ),
      },
      {
        method: "GET",
        path: "/api/health",
        description: "Health check: verifikasi environment variables dan koneksi Google Sheets.",
        responseExample: JSON.stringify(
          {
            GOOGLE_SERVICE_ACCOUNT_JSON: "SET (length: 2400, starts: {\"type\":\"service_ac...)",
            GOOGLE_SHEET_ID: "SET (length: 44)",
            ADMIN_PASSWORD: "SET (length: 8)",
            JSON_PARSE: "OK - keys: type, project_id, ...",
          },
          null,
          2
        ),
      },
    ],
  },
];

const methodColor: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminDocsPage() {
  const [openIdx, setOpenIdx] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenIdx(openIdx === key ? null : key);
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">API Documentation</h1>
        <p className="text-gray-400 mt-1">Referensi lengkap semua endpoint API</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">GET</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">POST</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">PUT</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">DELETE</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            = Auth Required
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {endpoints.map((group) => (
          <div key={group.category}>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
              {group.category}
            </h2>
            <div className="space-y-2">
              {group.items.map((ep, i) => {
                const key = `${group.category}-${i}`;
                const isOpen = openIdx === key;
                return (
                  <div key={key} className="glass-card rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-all"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${methodColor[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-white font-mono flex-1">{ep.path}</code>
                      {ep.auth && (
                        <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <svg className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                        <p className="text-sm text-gray-300">{ep.description}</p>

                        {ep.auth && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                            <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-xs text-purple-300">Header: <code className="font-mono">Authorization: Bearer &lt;token&gt;</code></span>
                          </div>
                        )}

                        {ep.queryParams && ep.queryParams.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Query Parameters</h4>
                            <div className="rounded-lg border border-white/5 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-white/[0.02]">
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Param</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Type</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Wajib</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ep.queryParams.map((p) => (
                                    <tr key={p.name} className="border-t border-white/5">
                                      <td className="px-3 py-2 font-mono text-indigo-300">{p.name}</td>
                                      <td className="px-3 py-2 text-gray-400">{p.type}</td>
                                      <td className="px-3 py-2">{p.required ? <span className="text-red-400">Ya</span> : <span className="text-gray-500">Tidak</span>}</td>
                                      <td className="px-3 py-2 text-gray-300">{p.desc}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {ep.bodyParams && ep.bodyParams.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Body (JSON)</h4>
                            <div className="rounded-lg border border-white/5 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-white/[0.02]">
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Field</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Type</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Wajib</th>
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ep.bodyParams.map((p) => (
                                    <tr key={p.name} className="border-t border-white/5">
                                      <td className="px-3 py-2 font-mono text-indigo-300">{p.name}</td>
                                      <td className="px-3 py-2 text-gray-400">{p.type}</td>
                                      <td className="px-3 py-2">{p.required ? <span className="text-red-400">Ya</span> : <span className="text-gray-500">Tidak</span>}</td>
                                      <td className="px-3 py-2 text-gray-300">{p.desc}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Response Example</h4>
                            <button
                              onClick={() => copyToClipboard(ep.responseExample, key)}
                              className="text-[10px] font-semibold text-gray-500 hover:text-white transition-colors px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.06]"
                            >
                              {copied === key ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <pre className="rounded-lg bg-black/30 border border-white/5 p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                            {ep.responseExample}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl p-4 bg-indigo-500/5 border border-indigo-500/10">
        <p className="text-xs text-indigo-300">
          <strong>Catatan:</strong> Sesi aktif ditentukan otomatis berdasarkan jam saat ini (WIB). Tidak perlu mengatur sesi aktif atau tanggal ujian secara manual. Jika jam berada dalam rentang sesi 1 atau sesi 2, maka sesi tersebut aktif.
        </p>
      </div>
    </div>
  );
}

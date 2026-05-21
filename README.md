# ExamCoy - Portal Ujian & Monitoring Siswa

Aplikasi web modern menggunakan **Next.js** dan **Tailwind CSS** untuk pendaftaran akun ujian, monitoring pelanggaran, dan manajemen sesi ujian siswa. Data disimpan ke **Google Sheets**, notifikasi pelanggaran dikirim via **Telegram Bot**.

## Tech Stack

- **Next.js 16** (App Router) — React Framework
- **Tailwind CSS 4** — Styling (dark mode)
- **Google Sheets API** — Database via `googleapis`
- **Telegram Bot API** — Notifikasi pelanggaran
- **jose** — JWT authentication untuk admin
- **Netlify** — Deployment

## Fitur

- Landing page modern dengan dark mode
- Form pendaftaran akun ujian (Nama, NIS 5 digit, Kelas)
- Check NIS untuk melihat status pendaftaran
- Data otomatis sorted by NIS & auto-numbered
- Data dikirim ke sheet yang sesuai (KELAS X / KELAS XI / KELAS XII)
- **Admin Dashboard** — Login dengan password, kelola siswa (CRUD), pengaturan ujian
- **Monitoring Pelanggaran** — Rekap pelanggaran siswa saat ujian (Keluar App, Overlay, Unpin)
- **API untuk App ExamCoy** — Endpoint untuk app Android (sesi ujian, lapor pelanggaran, report ke Telegram)
- **Rate Limiting** — Proteksi anti-spam per IP di endpoint publik
- **Security Headers** — XSS, clickjacking, HSTS, MIME sniffing protection

---

## Instalasi Lokal

```bash
# 1. Clone & install
git clone <repo-url> cakunexam
cd cakunexam
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local dengan credentials Anda

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SETTINGS_SHEET_ID=your_settings_sheet_id

# Admin
ADMIN_PASSWORD=your_admin_password

# Encryption (AES-256-CBC untuk url_ujian & pin_out)
ENCRYPTION_KEY=your_encryption_key

# Telegram Bot (notifikasi pelanggaran)
BOT_TOKEN=your_telegram_bot_token
CHAT_ID=@your_telegram_chat_id
```

---

## Setup Google Service Account

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** > **New Project**
3. Beri nama project (misal: `ExamCoy`) > **Create**

### 2. Aktifkan Google Sheets API

1. Buka **APIs & Services** > **Library**
2. Cari **Google Sheets API** > klik **Enable**

### 3. Buat Service Account

1. Buka **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **Service Account**
3. Isi nama (misal: `examcoy-sheets`) > **Create and Continue**
4. Role: **Editor** > **Continue** > **Done**

### 4. Download JSON Key

1. Klik nama Service Account yang baru dibuat
2. Tab **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**
3. File JSON akan terdownload

### 5. Setup .env.local

Buka file JSON yang terdownload, copy **seluruh isinya** sebagai satu baris ke `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}
GOOGLE_SHEET_ID=your_sheet_id
```

> **Tip**: Buka file JSON, select all, lalu paste. Pastikan dalam satu baris.

### 6. Share Google Sheet ke Service Account

1. Dari file JSON, copy nilai `client_email`
2. Buka Google Sheet > klik **Share**
3. Paste email Service Account > beri akses **Editor** > **Send**

### 7. Siapkan Google Sheet

Pastikan Google Sheet memiliki 3 tab/sheet:
- **KELAS X**
- **KELAS XI**
- **KELAS XII**

Masing-masing tab beri header di baris pertama: `NO | NIS | NAMA | KELAS`

Sheet **SETTINGS** dan **PELANGGARAN** akan dibuat otomatis oleh aplikasi.

---

## Deploy ke Netlify

1. Push repo ke GitHub
2. Buka [netlify.com](https://netlify.com) > **Add new site** > Import repo
3. Di **Environment Variables**, tambahkan semua variable dari `.env.example`
4. Klik **Deploy**

---

## API Routes

### Public (tanpa auth)

| Method | URI | Deskripsi | Rate Limit |
|--------|-----|-----------|------------|
| POST | `/register-exam` | Daftarkan siswa ke Google Sheet | 5 req / 2 menit per IP |
| POST | `/check-nis` | Cek NIS di semua sheet | - |
| GET | `/exam-info` | Ambil URL ujian & URL download APK | - |
| GET | `/siswa/api?sheet=KELAS X` | Ambil data siswa per sheet | - |
| GET | `/api/total-users` | Total siswa terdaftar (cached 60s) | - |
| GET | `/api/health` | Health check | - |

### Admin (butuh JWT Bearer token)

| Method | URI | Deskripsi | Rate Limit |
|--------|-----|-----------|------------|
| POST | `/api/admin/login` | Login admin, dapat JWT | 5 req / 15 menit per IP |
| GET | `/api/admin/students` | Ambil semua data siswa | - |
| POST | `/api/admin/students` | Tambah siswa baru | - |
| PUT | `/api/admin/students` | Edit data siswa | - |
| DELETE | `/api/admin/students` | Hapus siswa | - |
| GET | `/api/admin/settings` | Ambil pengaturan ujian | - |
| POST | `/api/admin/settings` | Simpan pengaturan ujian | - |

### App ExamCoy (endpoint untuk app Android)

| Method | URI | Deskripsi | Rate Limit |
|--------|-----|-----------|------------|
| GET | `/v1.0/sesi-ujian` | Cek sesi ujian yang aktif | - |
| GET | `/v1.0/ujian` | Ambil data ujian (pin, URL, sesi) | - |
| POST | `/v1.0/lapor-pelanggaran` | Laporkan pelanggaran siswa | 30 req / 1 menit per IP |
| GET | `/v1.0/pelanggaran` | Ambil data pelanggaran (filter sesi/tanggal) | - |
| POST | `/v1.0/report` | Kirim laporan + foto ke Telegram Bot | - |

### Jenis Pelanggaran

| Kode | Deskripsi | Kategori |
|------|-----------|----------|
| `KELUAR_APP` | Siswa keluar/minimize app saat ujian | Keluar App |
| `OVERLAY_TERDETEKSI` | Ada overlay/floating app terdeteksi | Kecurangan Teknis |
| `UNPIN_UJIAN` | Siswa paksa unpin/lepas screen lock | Kecurangan Teknis |

> Di dashboard monitoring, `OVERLAY_TERDETEKSI` dan `UNPIN_UJIAN` digabung dalam satu grup **"Overlay / Unpin"**. Data asli tetap tersimpan terpisah di Google Sheet.

---

## Security

- **Rate Limiting** — In-memory per IP untuk endpoint register, login, dan lapor pelanggaran
- **JWT Authentication** — Admin endpoints dilindungi JWT (HS256, 2 jam expiry)
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, X-XSS-Protection, Permissions-Policy
- **Timing-safe compare** — Login password pakai `crypto.timingSafeEqual`
- **Input sanitization** — Mencegah spreadsheet formula injection
- **Encrypted settings** — `pin_out` dan `url_ujian` dienkripsi AES-256-CBC di Google Sheet

---

## License

MIT

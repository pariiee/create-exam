# ExamCoy - Portal Pendaftaran Akun Ujian

Aplikasi web landing page modern menggunakan **Next.js** dan **Tailwind CSS** untuk pendaftaran akun ujian siswa. Data disimpan ke **Google Sheets**.

## Tech Stack

- **Next.js 15** (App Router) — React Framework
- **Tailwind CSS** — Styling (dark mode)
- **Google Sheets API** — Database via `googleapis`
- **Vercel** — Deployment

## Fitur

- Landing page modern dengan dark mode
- Form pendaftaran akun ujian (Nama, NIS 5 digit, Kelas)
- Check NIS untuk melihat status pendaftaran
- Data otomatis sorted by NIS & auto-numbered
- Data dikirim ke sheet yang sesuai (KELAS X / KELAS XI / KELAS XII)

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
GOOGLE_SHEET_ID=
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

---

## Deploy ke Vercel

1. Push repo ke GitHub
2. Buka [vercel.com](https://vercel.com) > **New Project** > Import repo
3. Di **Environment Variables**, tambahkan:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = isi JSON service account (satu baris)
   - `GOOGLE_SHEET_ID` = ID Google Sheet
4. Klik **Deploy**

---

## API Routes

| Method | URI | Deskripsi |
|--------|-----|-----------|
| POST | `/api/register-exam` | Simpan data ke Google Sheet |
| POST | `/api/check-nis` | Cek NIS di semua sheet |

---

## License

MIT

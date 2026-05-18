import { NextRequest, NextResponse } from "next/server";
import { getSheetData, appendToSheet, rewriteSheet, getSettingsSheetId } from "@/lib/sheets";
import { google } from "googleapis";

const PELANGGARAN_SHEET = "PELANGGARAN";

function getJakartaTimestamp(): string {
  const now = new Date();
  const jakartaOffset = 7 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakarta = new Date(utcMs + jakartaOffset * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jakarta.getFullYear()}-${pad(jakarta.getMonth() + 1)}-${pad(jakarta.getDate())}T${pad(jakarta.getHours())}:${pad(jakarta.getMinutes())}:${pad(jakarta.getSeconds())}`;
}

async function ensurePelanggaranSheet() {
  const sid = getSettingsSheetId();
  try {
    await getSheetData(PELANGGARAN_SHEET, sid);
  } catch {
    let credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) throw new Error("Missing credentials");
    credentialsJson = credentialsJson.trim();
    if (credentialsJson.startsWith('"') && credentialsJson.endsWith('"')) {
      credentialsJson = JSON.parse(credentialsJson) as string;
    }
    const credentials = JSON.parse(credentialsJson as string);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: {
        requests: [{ addSheet: { properties: { title: PELANGGARAN_SHEET } } }],
      },
    });
    await rewriteSheet(
      PELANGGARAN_SHEET,
      [["TIMESTAMP", "NIS", "NAMA", "KELAS", "SESI", "JENIS_PELANGGARAN", "ALASAN", "FOTO_URL", "STATUS"]],
      sid
    );
  }
}

const VALID_JENIS = ["KELUAR_APP", "OVERLAY_TERDETEKSI"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nis, nama, kelas, sesi, jenis, alasan, foto_url } = body;

    if (!nis || !nama || !kelas || !sesi || !jenis) {
      return NextResponse.json(
        { success: false, message: "Field nis, nama, kelas, sesi, dan jenis wajib diisi." },
        { status: 400 }
      );
    }

    if (!VALID_JENIS.includes(jenis)) {
      return NextResponse.json(
        { success: false, message: `Jenis pelanggaran tidak valid. Gunakan: ${VALID_JENIS.join(", ")}` },
        { status: 400 }
      );
    }

    await ensurePelanggaranSheet();

    const timestamp = getJakartaTimestamp();
    const row = [
      timestamp,
      String(nis),
      String(nama),
      String(kelas),
      String(sesi),
      String(jenis),
      String(alasan || ""),
      String(foto_url || ""),
      "TERCATAT",
    ];

    await appendToSheet(PELANGGARAN_SHEET, [row], getSettingsSheetId());

    return NextResponse.json({ success: true, message: "Pelanggaran tercatat" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

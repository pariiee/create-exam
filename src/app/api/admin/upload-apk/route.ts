import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSheetData, rewriteSheet, getSettingsSheetId } from "@/lib/sheets";
import { readSettingsRows } from "@/lib/settings";
import { encrypt, decrypt } from "@/lib/crypto";
import fs from "fs";
import path from "path";

const SETTINGS_SHEET = "SETTINGS";

export async function POST(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validasi ekstensi file
    if (!file.name.endsWith(".apk")) {
      return NextResponse.json({ error: "Format file harus .apk" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tentukan path ke public/app.apk
    const publicDir = path.join(process.cwd(), "public");
    
    // Pastikan folder public ada
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, "app.apk");
    
    // Tulis file ke filesystem
    await fs.promises.writeFile(filePath, buffer);

    // Update settings di Google Sheet agar url_download_apk mengarah ke /app.apk
    const sid = getSettingsSheetId();
    const existingRows = await getSheetData(SETTINGS_SHEET, sid);
    const existing = readSettingsRows(existingRows);

    // Konversi pin_out_enabled ke format yang tepat
    let pinOutEnabledStr = existing["pin_out_enabled"] ?? "true";

    const merged = {
      pin_out: existing["pin_out"] ?? "",
      url_ujian: existing["url_ujian"] ?? "",
      url_download_apk: "/app.apk", // Mengarah ke local public file
      SESI_1_MULAI: existing["SESI_1_MULAI"] ?? "07:30",
      SESI_1_SELESAI: existing["SESI_1_SELESAI"] ?? "09:30",
      SESI_2_MULAI: existing["SESI_2_MULAI"] ?? "10:00",
      SESI_2_SELESAI: existing["SESI_2_SELESAI"] ?? "12:00",
      pin_out_enabled: pinOutEnabledStr,
    };

    await rewriteSheet(SETTINGS_SHEET, [
      ["KEY", "VALUE"],
      ["pin_out", merged.pin_out],
      ["url_ujian", merged.url_ujian],
      ["url_download_apk", merged.url_download_apk],
      ["SESI_1_MULAI", merged.SESI_1_MULAI],
      ["SESI_1_SELESAI", merged.SESI_1_SELESAI],
      ["SESI_2_MULAI", merged.SESI_2_MULAI],
      ["SESI_2_SELESAI", merged.SESI_2_SELESAI],
      ["pin_out_enabled", merged.pin_out_enabled],
    ], sid);

    return NextResponse.json({ 
      success: true, 
      message: "File APK berhasil diunggah!",
      url: "/app.apk"
    });
  } catch (error: unknown) {
    console.error("[Upload APK Error]", error);
    return NextResponse.json({ error: "Gagal mengunggah file APK." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, getSettingsSheetId } from "@/lib/sheets";
import { readSettingsRows } from "@/lib/settings";
import { encrypt, decrypt } from "@/lib/crypto";
import { verifyToken } from "@/lib/auth";
import { google } from "googleapis";

const SETTINGS_SHEET = "SETTINGS";

function getSettingsId(): string {
  return getSettingsSheetId();
}


async function ensureSettingsSheet() {
  const sid = getSettingsId();
  try {
    const rows = await getSheetData(SETTINGS_SHEET, sid);
    
    // Check if sheet has proper structure (at least header + some data rows)
    // If empty or missing structure, reinitialize it
    if (!rows || rows.length < 2) {
      await rewriteSheet(SETTINGS_SHEET, [
        ["KEY", "VALUE"],
        ["pin_out", ""],
        ["pin_out_enabled", "true"],
        ["url_ujian", ""],
        ["url_download_apk", ""],
        ["SESI_1_MULAI", "07:30"],
        ["SESI_1_SELESAI", "09:30"],
        ["SESI_2_MULAI", "10:00"],
        ["SESI_2_SELESAI", "12:00"],
      ], sid);
      return;
    }
    
    // Verify all required keys exist, if not add them
    const settings = readSettingsRows(rows);
    const requiredKeys = ["pin_out", "pin_out_enabled", "url_ujian", "url_download_apk", "SESI_1_MULAI", "SESI_1_SELESAI", "SESI_2_MULAI", "SESI_2_SELESAI"];
    const missingKeys = requiredKeys.filter(key => !(key in settings));
    
    if (missingKeys.length > 0) {
      const defaultSettings = {
        pin_out: "",
        pin_out_enabled: "true",
        url_ujian: "",
        url_download_apk: "",
        SESI_1_MULAI: "07:30",
        SESI_1_SELESAI: "09:30",
        SESI_2_MULAI: "10:00",
        SESI_2_SELESAI: "12:00",
      };
      
      const merged = { ...defaultSettings, ...settings };
      const newRows = [
        ["KEY", "VALUE"],
        ["pin_out", merged.pin_out],
        ["pin_out_enabled", merged.pin_out_enabled],
        ["url_ujian", merged.url_ujian],
        ["url_download_apk", merged.url_download_apk],
        ["SESI_1_MULAI", merged.SESI_1_MULAI],
        ["SESI_1_SELESAI", merged.SESI_1_SELESAI],
        ["SESI_2_MULAI", merged.SESI_2_MULAI],
        ["SESI_2_SELESAI", merged.SESI_2_SELESAI],
      ];
      await rewriteSheet(SETTINGS_SHEET, newRows, sid);
    }
  } catch (error) {
    // Sheet doesn't exist, create it
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
    
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sid,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SETTINGS_SHEET } } }],
        },
      });
    } catch {
      // Sheet might already exist but we can't access it, continue
    }
    
    // Write default header + values
    await rewriteSheet(SETTINGS_SHEET, [
      ["KEY", "VALUE"],
      ["pin_out", ""],
      ["pin_out_enabled", "true"],
      ["url_ujian", ""],
      ["url_download_apk", ""],
      ["SESI_1_MULAI", "07:30"],
      ["SESI_1_SELESAI", "09:30"],
      ["SESI_2_MULAI", "10:00"],
      ["SESI_2_SELESAI", "12:00"],
    ], sid);
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sid = getSettingsId();
    await ensureSettingsSheet();
    const rows = await getSheetData(SETTINGS_SHEET, sid);

    const settings = readSettingsRows(rows);

    // Decrypt pin_out dan url_ujian untuk tampilan admin
    settings.pin_out = decrypt(settings.pin_out ?? "");
    settings.url_ujian = decrypt(settings.url_ujian ?? "");

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error("[Settings GET]", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      pin_out, url_ujian, url_download_apk,
      sesi_1_mulai, sesi_1_selesai,
      sesi_2_mulai, sesi_2_selesai,
      pin_out_enabled,
    } = await request.json();

    await ensureSettingsSheet();

    // Read existing settings to preserve values not being updated
    const existingRows = await getSheetData(SETTINGS_SHEET, getSettingsId());
    const existing = readSettingsRows(existingRows);

    // Convert pin_out_enabled to ONLY "true" or "false" string - no ambiguity
    let pinOutEnabledStr: string;
    if (typeof pin_out_enabled === "boolean") {
      // Direct boolean conversion
      pinOutEnabledStr = pin_out_enabled ? "true" : "false";
    } else if (pin_out_enabled !== null && pin_out_enabled !== undefined) {
      // String or other type conversion
      const normalized = String(pin_out_enabled).trim().toLowerCase();
      pinOutEnabledStr = normalized === "false" || normalized === "0" || normalized === "off" ? "false" : "true";
    } else {
      // Use existing if not provided
      const existingValue = existing["pin_out_enabled"] ?? "true";
      pinOutEnabledStr = existingValue.toLowerCase() === "false" ? "false" : "true";
    }

    // Decrypt existing values untuk perbandingan
    const existingPinOut = decrypt(existing["pin_out"] ?? "");
    const existingUrlUjian = decrypt(existing["url_ujian"] ?? "");

    const merged = {
      pin_out: encrypt(pin_out ?? existingPinOut ?? ""),
      url_ujian: encrypt(url_ujian ?? existingUrlUjian ?? ""),
      url_download_apk: url_download_apk ?? existing["url_download_apk"] ?? "",
      SESI_1_MULAI: sesi_1_mulai ?? existing["SESI_1_MULAI"] ?? "07:30",
      SESI_1_SELESAI: sesi_1_selesai ?? existing["SESI_1_SELESAI"] ?? "09:30",
      SESI_2_MULAI: sesi_2_mulai ?? existing["SESI_2_MULAI"] ?? "10:00",
      SESI_2_SELESAI: sesi_2_selesai ?? existing["SESI_2_SELESAI"] ?? "12:00",
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
    ], getSettingsId());

    // Read back from sheet to verify save was successful
    const verifyRows = await getSheetData(SETTINGS_SHEET, getSettingsId());
    const verified = readSettingsRows(verifyRows);

    // Decrypt pin_out dan url_ujian untuk tampilan admin
    verified.pin_out = decrypt(verified.pin_out ?? "");
    verified.url_ujian = decrypt(verified.url_ujian ?? "");
    
    return NextResponse.json({ success: true, message: "Settings berhasil disimpan!", settings: verified });
  } catch (error: unknown) {
    console.error("[Settings POST Error]", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan." }, { status: 500 });
  }
}

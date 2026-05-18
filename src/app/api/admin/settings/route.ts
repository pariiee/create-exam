import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, getSettingsSheetId } from "@/lib/sheets";
import { readSettingsRows } from "@/lib/settings";
import { google } from "googleapis";

const SETTINGS_SHEET = "SETTINGS";

function getSettingsId(): string {
  return getSettingsSheetId();
}

function verifyToken(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    return decoded.startsWith(`admin:${adminPassword}:`);
  } catch {
    return false;
  }
}

async function ensureSettingsSheet() {
  const sid = getSettingsId();
  try {
    await getSheetData(SETTINGS_SHEET, sid);
  } catch {
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
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SETTINGS_SHEET } } }],
      },
    });
    // Write default header + values
    await rewriteSheet(SETTINGS_SHEET, [
      ["KEY", "VALUE"],
      ["pin_out", ""],
      ["pin_out_enabled", "true"],
      ["url_ujian", ""],
      ["url_download_apk", ""],
    ], sid);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sid = getSettingsId();
    await ensureSettingsSheet();
    const rows = await getSheetData(SETTINGS_SHEET, sid);

    const settings = readSettingsRows(rows);

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
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

    const merged = {
      pin_out: pin_out ?? existing["pin_out"] ?? "",
      url_ujian: url_ujian ?? existing["url_ujian"] ?? "",
      url_download_apk: url_download_apk ?? existing["url_download_apk"] ?? "",
      SESI_1_MULAI: sesi_1_mulai ?? existing["SESI_1_MULAI"] ?? "07:30",
      SESI_1_SELESAI: sesi_1_selesai ?? existing["SESI_1_SELESAI"] ?? "09:30",
      SESI_2_MULAI: sesi_2_mulai ?? existing["SESI_2_MULAI"] ?? "10:00",
      SESI_2_SELESAI: sesi_2_selesai ?? existing["SESI_2_SELESAI"] ?? "12:00",
      pin_out_enabled: pin_out_enabled !== undefined ? String(pin_out_enabled) : existing["pin_out_enabled"] ?? "true",
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

    return NextResponse.json({ success: true, message: "Settings berhasil disimpan!", settings: merged });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

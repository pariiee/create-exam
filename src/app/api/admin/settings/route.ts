import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, getSettingsSheetId } from "@/lib/sheets";
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

    const settings: Record<string, string> = {};
    for (let i = 1; i < rows.length; i++) {
      const key = rows[i]?.[0];
      const value = rows[i]?.[1] ?? "";
      if (key) settings[key] = value;
    }

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
    const { pin_out, url_ujian, url_download_apk } = await request.json();

    await ensureSettingsSheet();

    await rewriteSheet(SETTINGS_SHEET, [
      ["KEY", "VALUE"],
      ["pin_out", pin_out ?? ""],
      ["url_ujian", url_ujian ?? ""],
      ["url_download_apk", url_download_apk ?? ""],
    ], getSettingsId());

    return NextResponse.json({ success: true, message: "Settings berhasil disimpan!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

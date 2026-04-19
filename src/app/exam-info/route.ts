import { NextResponse } from "next/server";
import { getSheetData, getSettingsSheetId } from "@/lib/sheets";

const SETTINGS_SHEET = "SETTINGS";

export async function GET() {
  try {
    const rows = await getSheetData(SETTINGS_SHEET, getSettingsSheetId());

    const settings: Record<string, string> = {};
    for (let i = 1; i < rows.length; i++) {
      const key = rows[i]?.[0];
      const value = rows[i]?.[1] ?? "";
      if (key) settings[key] = value;
    }

    return NextResponse.json({
      url_ujian: settings.url_ujian ?? "",
      url_download_apk: settings.url_download_apk ?? "",
    });
  } catch {
    return NextResponse.json({ url_ujian: "", url_download_apk: "" });
  }
}

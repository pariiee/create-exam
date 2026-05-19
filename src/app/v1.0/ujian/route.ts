import { NextResponse } from "next/server";
import { getSheetData, getSettingsSheetId } from "@/lib/sheets";
import { readSettingsRows, settingToBoolean } from "@/lib/settings";
import { encrypt } from "@/lib/crypto";

const SETTINGS_SHEET = "SETTINGS";

function getJakartaTime(): Date {
  const now = new Date();
  const jakartaOffset = 7 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + jakartaOffset * 60000);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isInRange(nowMin: number, mulai: string, selesai: string): boolean {
  const mulaiMin = timeToMinutes(mulai);
  const selesaiMin = timeToMinutes(selesai);
  if (mulaiMin <= selesaiMin) {
    return nowMin >= mulaiMin && nowMin <= selesaiMin;
  }
  return nowMin >= mulaiMin || nowMin <= selesaiMin;
}

export async function GET() {
  try {
    const rows = await getSheetData(SETTINGS_SHEET, getSettingsSheetId());

    const settings = readSettingsRows(rows);

    const sesi1Mulai = settings["SESI_1_MULAI"] || "07:30";
    const sesi1Selesai = settings["SESI_1_SELESAI"] || "09:30";
    const sesi2Mulai = settings["SESI_2_MULAI"] || "10:00";
    const sesi2Selesai = settings["SESI_2_SELESAI"] || "12:00";

    const jakarta = getJakartaTime();
    const nowMinutes = jakarta.getHours() * 60 + jakarta.getMinutes();

    const sesi1Active = isInRange(nowMinutes, sesi1Mulai, sesi1Selesai);
    const sesi2Active = isInRange(nowMinutes, sesi2Mulai, sesi2Selesai);

    if (sesi1Active) {
      return NextResponse.json({
        pin_out: encrypt(settings.pin_out ?? ""),
        url_ujian: encrypt(settings.url_ujian ?? ""),
        sesi: 1,
        pin_out_enabled: settingToBoolean(settings.pin_out_enabled, true),
      });
    }

    if (sesi2Active) {
      return NextResponse.json({
        pin_out: encrypt(settings.pin_out ?? ""),
        url_ujian: encrypt(settings.url_ujian ?? ""),
        sesi: 2,
        pin_out_enabled: settingToBoolean(settings.pin_out_enabled, true),
      });
    }

    return NextResponse.json({
      error: true,
      message: "Tidak ada sesi ujian yang aktif saat ini.",
    });
  } catch {
    return NextResponse.json({ pin_out: "", url_ujian: "" });
  }
}

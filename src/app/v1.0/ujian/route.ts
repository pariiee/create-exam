import { NextResponse } from "next/server";
import { getSheetData, getSettingsSheetId } from "@/lib/sheets";

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

export async function GET() {
  try {
    const rows = await getSheetData(SETTINGS_SHEET, getSettingsSheetId());

    const settings: Record<string, string> = {};
    for (let i = 1; i < rows.length; i++) {
      const key = rows[i]?.[0];
      const value = rows[i]?.[1] ?? "";
      if (key) settings[key] = value;
    }

    const tanggalUjian = settings["TANGGAL_UJIAN"] || "";
    const sesiAktif = parseInt(settings["SESI_AKTIF"] || "1", 10);

    const sesiMulaiKey = `SESI_${sesiAktif}_MULAI`;
    const sesiSelesaiKey = `SESI_${sesiAktif}_SELESAI`;
    const mulai = settings[sesiMulaiKey] || "";
    const selesai = settings[sesiSelesaiKey] || "";

    const jakarta = getJakartaTime();
    const todayStr = jakarta.toISOString().slice(0, 10);
    const isToday = tanggalUjian === todayStr;
    const nowMinutes = jakarta.getHours() * 60 + jakarta.getMinutes();

    if (!isToday) {
      return NextResponse.json({
        error: true,
        message: `Ujian dijadwalkan tanggal ${tanggalUjian || "(belum diatur)"}. Hari ini bukan tanggal ujian.`,
      });
    }

    if (mulai && selesai) {
      const mulaiMin = timeToMinutes(mulai);
      const selesaiMin = timeToMinutes(selesai);

      if (nowMinutes < mulaiMin) {
        return NextResponse.json({
          error: true,
          message: `Ujian belum dimulai. Sesi ${sesiAktif} mulai pukul ${mulai}`,
        });
      }

      if (nowMinutes > selesaiMin) {
        return NextResponse.json({
          error: true,
          message: `Sesi ${sesiAktif} sudah selesai (${mulai} - ${selesai})`,
        });
      }
    }

    return NextResponse.json({
      pin_out: settings.pin_out ?? "",
      url_ujian: settings.url_ujian ?? "",
      sesi: sesiAktif,
    });
  } catch {
    return NextResponse.json({ pin_out: "", url_ujian: "" });
  }
}

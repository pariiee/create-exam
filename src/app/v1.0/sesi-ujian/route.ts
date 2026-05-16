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

function isInRange(nowMin: number, mulai: string, selesai: string): boolean {
  const mulaiMin = timeToMinutes(mulai);
  const selesaiMin = timeToMinutes(selesai);
  if (mulaiMin <= selesaiMin) {
    return nowMin >= mulaiMin && nowMin <= selesaiMin;
  }
  // Crosses midnight (e.g. 23:25 - 00:00)
  return nowMin >= mulaiMin || nowMin <= selesaiMin;
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

    const sesi1Mulai = settings["SESI_1_MULAI"] || "07:30";
    const sesi1Selesai = settings["SESI_1_SELESAI"] || "09:30";
    const sesi2Mulai = settings["SESI_2_MULAI"] || "10:00";
    const sesi2Selesai = settings["SESI_2_SELESAI"] || "12:00";

    const jakarta = getJakartaTime();
    const nowMinutes = jakarta.getHours() * 60 + jakarta.getMinutes();

    const sesi1Active = isInRange(nowMinutes, sesi1Mulai, sesi1Selesai);
    const sesi2Active = isInRange(nowMinutes, sesi2Mulai, sesi2Selesai);

    const sesi1Status = sesi1Active ? "aktif" : "tidak_aktif";
    const sesi2Status = sesi2Active ? "aktif" : "tidak_aktif";

    const sesiAktif = sesi1Active ? 1 : sesi2Active ? 2 : 0;
    const bolehMasuk = sesi1Active || sesi2Active;

    let pesan = "";
    if (sesi1Active) {
      pesan = `Sesi 1 sedang berlangsung (${sesi1Mulai} - ${sesi1Selesai})`;
    } else if (sesi2Active) {
      pesan = `Sesi 2 sedang berlangsung (${sesi2Mulai} - ${sesi2Selesai})`;
    } else {
      pesan = "Tidak ada sesi yang aktif saat ini";
    }

    return NextResponse.json({
      sesi_aktif: sesiAktif,
      sesi: [
        {
          nomor: 1,
          mulai: sesi1Mulai,
          selesai: sesi1Selesai,
          status: sesi1Status,
        },
        {
          nomor: 2,
          mulai: sesi2Mulai,
          selesai: sesi2Selesai,
          status: sesi2Status,
        },
      ],
      boleh_masuk: bolehMasuk,
      pesan,
    });
  } catch {
    return NextResponse.json(
      { error: true, message: "Gagal memuat data sesi ujian" },
      { status: 500 }
    );
  }
}

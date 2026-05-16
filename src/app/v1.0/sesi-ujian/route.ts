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

function getSesiStatus(
  mulai: string,
  selesai: string,
  sesiNomor: number,
  sesiAktif: number,
  nowMinutes: number,
  isToday: boolean
): string {
  if (!isToday) return "belum_mulai";
  if (sesiNomor !== sesiAktif) return "belum_mulai";
  const mulaiMin = timeToMinutes(mulai);
  const selesaiMin = timeToMinutes(selesai);
  if (nowMinutes < mulaiMin) return "belum_mulai";
  if (nowMinutes >= mulaiMin && nowMinutes <= selesaiMin) return "aktif";
  return "selesai";
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
    const sesi1Mulai = settings["SESI_1_MULAI"] || "07:30";
    const sesi1Selesai = settings["SESI_1_SELESAI"] || "09:30";
    const sesi2Mulai = settings["SESI_2_MULAI"] || "10:00";
    const sesi2Selesai = settings["SESI_2_SELESAI"] || "12:00";

    const jakarta = getJakartaTime();
    const todayStr = jakarta.toISOString().slice(0, 10);
    const isToday = tanggalUjian === todayStr;
    const nowMinutes = jakarta.getHours() * 60 + jakarta.getMinutes();

    const sesi1Status = getSesiStatus(sesi1Mulai, sesi1Selesai, 1, sesiAktif, nowMinutes, isToday);
    const sesi2Status = getSesiStatus(sesi2Mulai, sesi2Selesai, 2, sesiAktif, nowMinutes, isToday);

    let bolehMasuk = false;
    let pesan = "";

    if (!isToday) {
      pesan = `Ujian dijadwalkan tanggal ${tanggalUjian || "(belum diatur)"}`;
    } else if (sesiAktif === 1) {
      if (sesi1Status === "aktif") {
        bolehMasuk = true;
        pesan = `Sesi 1 sedang berlangsung (${sesi1Mulai} - ${sesi1Selesai})`;
      } else if (sesi1Status === "belum_mulai") {
        pesan = `Sesi 1 belum dimulai. Mulai pukul ${sesi1Mulai}`;
      } else {
        pesan = `Sesi 1 sudah selesai (${sesi1Mulai} - ${sesi1Selesai})`;
      }
    } else if (sesiAktif === 2) {
      if (sesi2Status === "aktif") {
        bolehMasuk = true;
        pesan = `Sesi 2 sedang berlangsung (${sesi2Mulai} - ${sesi2Selesai})`;
      } else if (sesi2Status === "belum_mulai") {
        pesan = `Sesi 2 belum dimulai. Mulai pukul ${sesi2Mulai}`;
      } else {
        pesan = `Sesi 2 sudah selesai (${sesi2Mulai} - ${sesi2Selesai})`;
      }
    }

    return NextResponse.json({
      tanggal_ujian: tanggalUjian,
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

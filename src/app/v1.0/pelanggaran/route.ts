import { NextRequest, NextResponse } from "next/server";
import { getSheetData, getSettingsSheetId } from "@/lib/sheets";

const PELANGGARAN_SHEET = "PELANGGARAN";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sesiFilter = searchParams.get("sesi");
    const tanggalFilter = searchParams.get("tanggal");

    let rows: string[][];
    try {
      rows = await getSheetData(PELANGGARAN_SHEET, getSettingsSheetId());
    } catch {
      return NextResponse.json({
        tanggal: tanggalFilter || "",
        sesi: sesiFilter ? parseInt(sesiFilter, 10) : null,
        total_pelanggaran: 0,
        data: [],
      });
    }

    if (rows.length <= 1) {
      return NextResponse.json({
        tanggal: tanggalFilter || "",
        sesi: sesiFilter ? parseInt(sesiFilter, 10) : null,
        total_pelanggaran: 0,
        data: [],
      });
    }

    let data = rows.slice(1).map((row) => ({
      timestamp: row[0] || "",
      nis: row[1] || "",
      nama: row[2] || "",
      kelas: row[3] || "",
      sesi: parseInt(row[4] || "0", 10),
      jenis: row[5] || "",
      alasan: row[6] || "",
      foto_url: row[7] || "",
      status: row[8] || "TERCATAT",
    }));

    if (tanggalFilter) {
      data = data.filter((d) => d.timestamp.startsWith(tanggalFilter));
    }

    if (sesiFilter) {
      const sesiNum = parseInt(sesiFilter, 10);
      data = data.filter((d) => d.sesi === sesiNum);
    }

    return NextResponse.json({
      tanggal: tanggalFilter || "",
      sesi: sesiFilter ? parseInt(sesiFilter, 10) : null,
      total_pelanggaran: data.length,
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nis } = body;

    // Validation
    if (!nis || !/^\d{5}$/.test(nis)) {
      return NextResponse.json({ error: "NIS harus tepat 5 digit angka." }, { status: 400 });
    }

    const sheetNames = ["KELAS X", "KELAS XI", "KELAS XII"];
    const results: { nama: string; nis: string; kelas: string }[] = [];

    for (const sheetName of sheetNames) {
      const rows = await getSheetData(sheetName);
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] && String(row[1]) === String(nis)) {
          results.push({
            nama: row[2] ?? "-",
            nis: row[1] ?? "-",
            kelas: row[3] ?? "-",
          });
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({
        found: false,
        message: `NIS ${nis} tidak ditemukan.`,
      });
    }

    return NextResponse.json({ found: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    console.error("Check NIS error:", message);
    return NextResponse.json({ error: "Gagal mengecek NIS: " + message }, { status: 500 });
  }
}

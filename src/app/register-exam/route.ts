import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, resolveSheetName, allKelas } from "@/lib/sheets";
import { registerLimiter } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per 2 minutes per IP
    const rateCheck = registerLimiter.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.` },
        { status: 429 }
      );
    }
    registerLimiter.record(request);

    const body = await request.json();
    const { nama, nis, kelas } = body;

    // Validation
    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    }
    if (!nis || !/^\d{5}$/.test(nis)) {
      return NextResponse.json({ error: "NIS harus tepat 5 digit angka." }, { status: 400 });
    }
    if (!kelas || !allKelas.includes(kelas)) {
      return NextResponse.json({ error: "Kelas yang dipilih tidak valid." }, { status: 400 });
    }

    const sheetName = resolveSheetName(kelas);

    // Check NIS uniqueness across ALL class sheets
    const ALL_SHEETS = ["KELAS X", "KELAS XI", "KELAS XII"];
    for (const sheet of ALL_SHEETS) {
      try {
        const rows = await getSheetData(sheet);
        for (let i = 1; i < rows.length; i++) {
          const rowNis = String(rows[i][1] ?? "").trim();
          if (rowNis === nis.trim()) {
            return NextResponse.json({
              error: "NIS nya udah terdaftar nih",
              duplicate: {
                nis: rowNis,
                nama: rows[i][2] ?? "",
                kelas: rows[i][3] ?? "",
                sheet,
              },
            }, { status: 409 });
          }
        }
      } catch {
        // Sheet might not exist yet, skip
      }
    }

    // Read existing data (including header)
    const allRows = await getSheetData(sheetName);
    const header = allRows.length > 0 ? allRows[0] : ["NO", "NIS", "NAMA", "KELAS"];
    const dataRows = allRows.slice(1);

    // Collect existing data (skip empty rows)
    const existing: { nis: string; nama: string; kelas: string }[] = [];
    for (const row of dataRows) {
      const rowNis = row[1] ?? "";
      if (rowNis === "") continue;
      existing.push({
        nis: String(rowNis),
        nama: row[2] ?? "",
        kelas: row[3] ?? "",
      });
    }

    // Add new entry
    existing.push({
      nis: nis.trim(),
      nama: nama.trim(),
      kelas,
    });

    // Sort by NIS ascending
    existing.sort((a, b) => a.nis.localeCompare(b.nis));

    // Rebuild with auto-numbered NO
    const writeRows: (string | number)[][] = [header];
    let no = 1;
    for (const row of existing) {
      writeRows.push([no++, row.nis, row.nama, row.kelas]);
    }

    // Rewrite entire sheet
    await rewriteSheet(sheetName, writeRows);

    return NextResponse.json({ success: true, message: "Akun ujian berhasil didaftarkan!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    console.error("Register error:", message);
    return NextResponse.json({ error: "Gagal menyimpan data: " + message }, { status: 500 });
  }
}

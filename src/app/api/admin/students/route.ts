import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, resolveSheetName, allKelas } from "@/lib/sheets";
import { verifyToken } from "@/lib/auth";
import { sanitizeInput } from "@/lib/sanitize";

const SHEETS = ["KELAS X", "KELAS XI", "KELAS XII"];
const MAX_NAMA_LENGTH = 100;

// GET - fetch all students
export async function GET(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allStudents: { no: string; nis: string; nama: string; kelas: string; sheet: string }[] = [];
    for (const sheet of SHEETS) {
      try {
        const rows = await getSheetData(sheet);
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row[1] && row[1] !== "") {
            allStudents.push({
              no: row[0] ?? "",
              nis: row[1] ?? "",
              nama: row[2] ?? "",
              kelas: row[3] ?? "",
              sheet,
            });
          }
        }
      } catch {
        // Sheet might not exist yet
      }
    }
    return NextResponse.json({ students: allStudents });
  } catch (error: unknown) {
    console.error("[Students GET]", error);
    return NextResponse.json({ error: "Gagal memuat data siswa." }, { status: 500 });
  }
}

// DELETE - delete a student by NIS and sheet
export async function DELETE(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nis, sheet } = await request.json();
    if (!nis || !sheet) {
      return NextResponse.json({ error: "NIS dan sheet diperlukan." }, { status: 400 });
    }
    if (!SHEETS.includes(sheet)) {
      return NextResponse.json({ error: "Sheet tidak valid." }, { status: 400 });
    }

    const rows = await getSheetData(sheet);
    const header = rows[0] || [];
    const filtered = rows.slice(1).filter((row) => row[1] !== nis);

    // Renumber
    const renumbered = filtered.map((row, i) => {
      const newRow = [...row];
      newRow[0] = String(i + 1);
      return newRow;
    });

    await rewriteSheet(sheet, [header, ...renumbered]);
    return NextResponse.json({ success: true, message: `Siswa dengan NIS ${nis} berhasil dihapus.` });
  } catch (error: unknown) {
    console.error("[Students DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus siswa." }, { status: 500 });
  }
}

// POST - add a new student
export async function POST(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nama, nis, kelas } = await request.json();

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    }
    if (nama.trim().length > MAX_NAMA_LENGTH) {
      return NextResponse.json({ error: `Nama maksimal ${MAX_NAMA_LENGTH} karakter.` }, { status: 400 });
    }
    if (!nis || !/^\d{5}$/.test(nis)) {
      return NextResponse.json({ error: "NIS harus tepat 5 digit angka." }, { status: 400 });
    }
    if (!kelas || !allKelas.includes(kelas)) {
      return NextResponse.json({ error: "Kelas yang dipilih tidak valid." }, { status: 400 });
    }

    const safeName = sanitizeInput(nama);
    if (safeName.length === 0) {
      return NextResponse.json({ error: "Nama mengandung karakter tidak valid." }, { status: 400 });
    }

    // Check NIS uniqueness across all sheets
    for (const sheet of SHEETS) {
      try {
        const rows = await getSheetData(sheet);
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][1] ?? "").trim() === nis.trim()) {
            return NextResponse.json({
              error: `NIS ${nis} sudah terdaftar (${rows[i][2] ?? ""} - ${rows[i][3] ?? ""}).`,
            }, { status: 409 });
          }
        }
      } catch {
        // Sheet might not exist yet
      }
    }

    const sheetName = resolveSheetName(kelas);
    const allRows = await getSheetData(sheetName);
    const header = allRows.length > 0 ? allRows[0] : ["NO", "NIS", "NAMA", "KELAS"];
    const dataRows = allRows.slice(1).filter((row) => row[1] && row[1] !== "");

    dataRows.push(["", nis.trim(), safeName, kelas]);

    // Sort by NIS ascending
    dataRows.sort((a, b) => (a[1] || "").localeCompare(b[1] || ""));

    // Renumber
    const writeRows: (string | number)[][] = [header];
    let no = 1;
    for (const row of dataRows) {
      writeRows.push([no++, row[1], row[2], row[3]]);
    }

    await rewriteSheet(sheetName, writeRows);

    return NextResponse.json({ success: true, message: "Siswa berhasil ditambahkan!" });
  } catch (error: unknown) {
    console.error("[Students POST]", error);
    return NextResponse.json({ error: "Gagal menambahkan siswa." }, { status: 500 });
  }
}

// PUT - edit a student
export async function PUT(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { oldNis, oldSheet, nama, nis, kelas } = await request.json();
    if (!oldNis || !oldSheet || !nama || !nis || !kelas) {
      return NextResponse.json({ error: "Semua field diperlukan." }, { status: 400 });
    }
    if (!SHEETS.includes(oldSheet)) {
      return NextResponse.json({ error: "Sheet tidak valid." }, { status: 400 });
    }
    if (typeof nama === "string" && nama.trim().length > MAX_NAMA_LENGTH) {
      return NextResponse.json({ error: `Nama maksimal ${MAX_NAMA_LENGTH} karakter.` }, { status: 400 });
    }

    const safeName = sanitizeInput(String(nama));
    if (safeName.length === 0) {
      return NextResponse.json({ error: "Nama mengandung karakter tidak valid." }, { status: 400 });
    }

    const newSheet = resolveSheetName(kelas);

    // Read old sheet and remove the student
    const oldRows = await getSheetData(oldSheet);
    const oldHeader = oldRows[0] || [];
    const remaining = oldRows.slice(1).filter((row) => row[1] !== oldNis);

    // Renumber old sheet
    const renumberedOld = remaining.map((row, i) => {
      const newRow = [...row];
      newRow[0] = String(i + 1);
      return newRow;
    });

    if (oldSheet === newSheet) {
      // Same sheet — add updated student back
      const newNo = String(renumberedOld.length + 1);
      renumberedOld.push([newNo, nis, safeName, kelas]);
      await rewriteSheet(oldSheet, [oldHeader, ...renumberedOld]);
    } else {
      // Different sheet — remove from old, add to new
      await rewriteSheet(oldSheet, [oldHeader, ...renumberedOld]);

      const newRows = await getSheetData(newSheet);
      const newHeader = newRows[0] || ["NO", "NIS", "NAMA", "KELAS"];
      const newData = newRows.slice(1);
      const newNo = String(newData.length + 1);
      newData.push([newNo, nis, safeName, kelas]);
      await rewriteSheet(newSheet, [newHeader, ...newData]);
    }

    return NextResponse.json({ success: true, message: "Data siswa berhasil diperbarui." });
  } catch (error: unknown) {
    console.error("[Students PUT]", error);
    return NextResponse.json({ error: "Gagal memperbarui data siswa." }, { status: 500 });
  }
}

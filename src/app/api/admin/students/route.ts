import { NextRequest, NextResponse } from "next/server";
import { getSheetData, rewriteSheet, resolveSheetName } from "@/lib/sheets";

const SHEETS = ["KELAS X", "KELAS XI", "KELAS XII"];

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

// GET - fetch all students
export async function GET(request: NextRequest) {
  if (!verifyToken(request)) {
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
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - delete a student by NIS and sheet
export async function DELETE(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nis, sheet } = await request.json();
    if (!nis || !sheet) {
      return NextResponse.json({ error: "NIS dan sheet diperlukan." }, { status: 400 });
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
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT - edit a student
export async function PUT(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { oldNis, oldSheet, nama, nis, kelas } = await request.json();
    if (!oldNis || !oldSheet || !nama || !nis || !kelas) {
      return NextResponse.json({ error: "Semua field diperlukan." }, { status: 400 });
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
      renumberedOld.push([newNo, nis, nama, kelas]);
      await rewriteSheet(oldSheet, [oldHeader, ...renumberedOld]);
    } else {
      // Different sheet — remove from old, add to new
      await rewriteSheet(oldSheet, [oldHeader, ...renumberedOld]);

      const newRows = await getSheetData(newSheet);
      const newHeader = newRows[0] || ["NO", "NIS", "NAMA", "KELAS"];
      const newData = newRows.slice(1);
      const newNo = String(newData.length + 1);
      newData.push([newNo, nis, nama, kelas]);
      await rewriteSheet(newSheet, [newHeader, ...newData]);
    }

    return NextResponse.json({ success: true, message: "Data siswa berhasil diperbarui." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

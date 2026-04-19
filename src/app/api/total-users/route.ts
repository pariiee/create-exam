import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const sheets = ["KELAS X", "KELAS XI", "KELAS XII"];
    let total = 0;

    for (const sheet of sheets) {
      try {
        const rows = await getSheetData(sheet);
        // Skip header, count non-empty rows
        total += rows.slice(1).filter((r) => r[1] && r[1] !== "").length;
      } catch {
        // Sheet might not exist yet
      }
    }

    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}

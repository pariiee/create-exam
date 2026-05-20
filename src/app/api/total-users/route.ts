import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

// Cache to prevent Google Sheets API quota abuse
let cachedTotal: number | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
  const now = Date.now();
  if (cachedTotal !== null && now < cacheExpiry) {
    return NextResponse.json({ total: cachedTotal });
  }

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

    cachedTotal = total;
    cacheExpiry = now + CACHE_TTL_MS;

    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}

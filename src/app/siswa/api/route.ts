import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  try {
    const sheet = request.nextUrl.searchParams.get("sheet");
    if (!sheet) {
      return NextResponse.json({ error: "Sheet parameter required." }, { status: 400 });
    }

    const allRows = await getSheetData(sheet);
    // Skip header row, filter out empty rows
    const rows = allRows.slice(1).filter((row) => row[1] && row[1] !== "");

    return NextResponse.json({ rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

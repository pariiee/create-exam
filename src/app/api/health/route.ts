import { NextResponse } from "next/server";

export async function GET() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const checks: Record<string, string> = {};

  // Check if env vars exist
  checks.GOOGLE_SERVICE_ACCOUNT_JSON = json ? `SET (length: ${json.length}, starts: ${json.substring(0, 20)}...)` : "NOT SET";
  checks.GOOGLE_SHEET_ID = sheetId ? `SET (length: ${sheetId.length})` : "NOT SET";
  checks.ADMIN_PASSWORD = adminPassword ? `SET (length: ${adminPassword.length})` : "NOT SET";

  // Try parsing JSON
  if (json) {
    try {
      let cleaned = json.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = JSON.parse(cleaned) as string;
      }
      const parsed = JSON.parse(cleaned);
      checks.JSON_PARSE = `OK - keys: ${Object.keys(parsed).join(", ")}`;
    } catch (e) {
      checks.JSON_PARSE = `FAIL - ${e instanceof Error ? e.message : "unknown error"}`;
      checks.JSON_FIRST_50 = json.substring(0, 50);
    }
  }

  return NextResponse.json(checks);
}

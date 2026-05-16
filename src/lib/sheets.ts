import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  let credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  // Handle double-quoted or escaped JSON from hosting providers
  credentialsJson = credentialsJson.trim();
  if (credentialsJson.startsWith('"') && credentialsJson.endsWith('"')) {
    credentialsJson = JSON.parse(credentialsJson) as string;
  }

  const credentials = JSON.parse(credentialsJson as string);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }
  return id;
}

export function getSettingsSheetId(): string {
  const id = process.env.GOOGLE_SETTINGS_SHEET_ID;
  if (!id) {
    throw new Error("GOOGLE_SETTINGS_SHEET_ID environment variable is not set");
  }
  return id;
}

/**
 * Read all rows from a sheet tab.
 */
export async function getSheetData(sheetName: string, spreadsheetIdOverride?: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdOverride || getSpreadsheetId(),
    range: sheetName,
  });
  return (res.data.values as string[][]) || [];
}

/**
 * Clear and rewrite entire sheet with new data.
 */
export async function rewriteSheet(sheetName: string, rows: (string | number)[][], spreadsheetIdOverride?: string): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = spreadsheetIdOverride || getSpreadsheetId();

  // Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetName,
    requestBody: {},
  });

  // Write new data
  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: rows,
      },
    });
  }
}

/**
 * Append rows to the end of a sheet.
 */
export async function appendToSheet(sheetName: string, rows: (string | number)[][], spreadsheetIdOverride?: string): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = spreadsheetIdOverride || getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });
}

/**
 * Determine sheet name based on class prefix.
 */
export function resolveSheetName(kelas: string): string {
  if (kelas.startsWith("XII")) return "KELAS XII";
  if (kelas.startsWith("XI")) return "KELAS XI";
  return "KELAS X";
}

export { kelasOptions, allKelas } from "./kelas";

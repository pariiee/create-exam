export type SettingsMap = Record<string, string>;

export function readSettingsRows(rows: unknown[][]): SettingsMap {
  const settings: SettingsMap = {};

  for (let i = 1; i < rows.length; i++) {
    const key = rows[i]?.[0];
    const value = rows[i]?.[1];
    if (key !== undefined && key !== null && String(key).trim()) {
      settings[String(key).trim()] = value === undefined || value === null ? "" : String(value).trim();
    }
  }

  return settings;
}

export function settingToBoolean(value: unknown, defaultValue = true): boolean {
  // Explicit null/undefined check
  if (value === null || value === undefined) return defaultValue;
  
  // If already boolean, return as-is
  if (typeof value === "boolean") return value;
  
  // Convert to string and normalize
  const str = String(value).trim();
  
  // Empty string uses default
  if (str === "") return defaultValue;
  
  const lower = str.toLowerCase();
  
  // Explicit false check
  if (lower === "false" || lower === "0" || lower === "off" || lower === "no") {
    return false;
  }
  
  // Explicit true check
  if (lower === "true" || lower === "1" || lower === "on" || lower === "yes") {
    return true;
  }
  
  // For any other value, use default (but log warning if unexpected)
  console.warn("[settingToBoolean] Unexpected value, using default:", value, "->", defaultValue);
  return defaultValue;
}

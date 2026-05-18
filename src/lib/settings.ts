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
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no", "disabled", "disable"].includes(normalized)) return false;
  if (["true", "1", "on", "yes", "enabled", "enable"].includes(normalized)) return true;

  return defaultValue;
}

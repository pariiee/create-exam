/**
 * Sanitize input to prevent spreadsheet formula injection.
 * Google Sheets may treat some leading characters as formulas when users paste/write values.
 */
export function sanitizeInput(value: string): string {
  let sanitized = value.trim();
  // Strip leading characters that trigger formula execution in spreadsheets
  while (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = sanitized.slice(1);
  }
  return sanitized;
}


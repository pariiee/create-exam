/**
 * Safely parse a fetch Response as JSON.
 * Throws a meaningful error if the response is not valid JSON
 * (e.g. when the hosting provider returns an HTML/text error page).
 */
export async function safeJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      !res.ok
        ? `Server error (${res.status}): ${text.substring(0, 120)}`
        : `Invalid JSON response: ${text.substring(0, 120)}`
    );
  }
}

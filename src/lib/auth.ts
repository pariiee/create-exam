import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const TOKEN_EXPIRY = "2h";

function getSecret(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return new TextEncoder().encode(key);
}

/**
 * Generate JWT token for admin.
 */
export async function signToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

/**
 * Verify JWT token from Authorization header.
 * Returns true if valid, false if invalid or expired.
 */
export async function verifyToken(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  try {
    const token = auth.slice(7);
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

// --- Rate Limiting ---
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check if login attempt is allowed (rate limit).
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfterSeconds?: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    loginAttempts.delete(ip);
  }

  const current = loginAttempts.get(ip);
  if (current && current.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt.
 */
export function recordFailedAttempt(request: NextRequest): void {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now <= entry.resetAt) {
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }
}

/**
 * Clear failed attempts after successful login.
 */
export function clearAttempts(request: NextRequest): void {
  const ip = getClientIp(request);
  loginAttempts.delete(ip);
}

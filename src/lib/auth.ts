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
    .setIssuer("examcoy")
    .setAudience("examcoy-admin")
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
    await jwtVerify(token, getSecret(), {
      issuer: "examcoy",
      audience: "examcoy-admin",
    });
    return true;
  } catch {
    return false;
  }
}

// --- Rate Limiting ---

export function getClientIp(request: NextRequest): string {
  // Prefer Next.js built-in ip (set by Vercel/platform, not spoofable)
  const platformIp = (request as unknown as { ip?: string }).ip;
  if (platformIp) return platformIp;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Create a reusable rate limiter with its own bucket.
 * @param maxAttempts - max requests allowed within the window
 * @param windowMs - time window in milliseconds
 */
export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  function check(request: NextRequest): { allowed: boolean; retryAfterSeconds?: number } {
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = attempts.get(ip);

    if (entry && now > entry.resetAt) {
      attempts.delete(ip);
    }

    const current = attempts.get(ip);
    if (current && current.count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true };
  }

  function record(request: NextRequest): void {
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = attempts.get(ip);

    if (entry && now <= entry.resetAt) {
      entry.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
    }
  }

  function clear(request: NextRequest): void {
    const ip = getClientIp(request);
    attempts.delete(ip);
  }

  return { check, record, clear };
}

// Login rate limiter: 5 attempts per 15 minutes
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);
export const checkRateLimit = loginLimiter.check;
export const recordFailedAttempt = loginLimiter.record;
export const clearAttempts = loginLimiter.clear;

// Register rate limiter: 5 requests per 2 minutes per IP
export const registerLimiter = createRateLimiter(5, 2 * 60 * 1000);

// Pelanggaran report rate limiter: 30 requests per minute per IP
export const pelanggaranLimiter = createRateLimiter(30, 60 * 1000);

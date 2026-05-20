import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signToken, checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/auth";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const rateCheck = checkRateLimit(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.` },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Admin password belum dikonfigurasi." }, { status: 500 });
    }

    if (!password || !safeCompare(String(password), String(adminPassword))) {
      recordFailedAttempt(request);
      return NextResponse.json({ error: "Password salah." }, { status: 401 });
    }

    clearAttempts(request);
    const token = await signToken();

    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

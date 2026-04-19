import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Admin password belum dikonfigurasi." }, { status: 500 });
    }

    if (!password || String(password) !== String(adminPassword)) {
      return NextResponse.json({ error: "Password salah." }, { status: 401 });
    }

    // Return a simple token (hash of password + secret)
    const token = Buffer.from(`admin:${adminPassword}:${Date.now()}`).toString("base64");

    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

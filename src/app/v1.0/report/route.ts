import { NextRequest, NextResponse } from "next/server";

function getJakartaTimeString(): string {
  const now = new Date();
  const jakartaOffset = 7 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakarta = new Date(utcMs + jakartaOffset * 60000);

  const dd = String(jakarta.getDate()).padStart(2, "0");
  const MM = String(jakarta.getMonth() + 1).padStart(2, "0");
  const yyyy = jakarta.getFullYear();
  const HH = String(jakarta.getHours()).padStart(2, "0");
  const mm = String(jakarta.getMinutes()).padStart(2, "0");
  const ss = String(jakarta.getSeconds()).padStart(2, "0");

  return `${dd}/${MM}/${yyyy} ${HH}:${mm}:${ss}`;
}

function buildCaption(nama: string, kelas: string, nis: string, sesi: string, alasan: string): string {
  const waktu = getJakartaTimeString();
  return (
    `⚠️ USER KELUAR TERDETEKSI ⚠️\n` +
    `\n` +
    `👤 Nama  : ${nama}\n` +
    `🏫 Kelas : ${kelas}\n` +
    `🆔 NIS   : ${nis}\n` +
    `📋 Sesi  : ${sesi}\n` +
    `🕐 Waktu : ${waktu} WIB\n` +
    `\n` +
    `📝 Alasan : ${alasan}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { success: false, message: "BOT_TOKEN or CHAT_ID is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const nama = (formData.get("nama") as string) || "";
    const kelas = (formData.get("kelas") as string) || "";
    const nis = (formData.get("nis") as string) || "";
    const sesi = (formData.get("sesi") as string) || "";
    const alasan = (formData.get("alasan") as string) || "";
    const photo = formData.get("photo") as File | null;

    const caption = buildCaption(nama, kelas, nis, sesi, alasan);

    if (photo && photo.size > 0) {
      // --- Send photo via sendPhoto ---
      const tgForm = new FormData();
      tgForm.append("chat_id", chatId);
      tgForm.append("caption", caption);

      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      const photoBlob = new Blob([photoBuffer], { type: photo.type || "image/jpeg" });
      tgForm.append("photo", photoBlob, photo.name || "photo.jpg");

      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: tgForm,
      });

      const sendJson = await sendRes.json();

      if (!sendJson.ok) {
        return NextResponse.json(
          { success: false, message: sendJson.description || "Telegram sendPhoto failed" },
          { status: 502 }
        );
      }

      // Get file_id from the largest photo size
      const photos = sendJson.result?.photo;
      const fileId = photos?.[photos.length - 1]?.file_id;

      if (!fileId) {
        return NextResponse.json({ success: true, foto_url: "" });
      }

      // --- Get file path via getFile ---
      const fileRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
      );
      const fileJson = await fileRes.json();

      if (!fileJson.ok || !fileJson.result?.file_path) {
        return NextResponse.json({ success: true, foto_url: "" });
      }

      const fotoUrl = `https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`;

      return NextResponse.json({ success: true, foto_url: fotoUrl });
    } else {
      // --- Send text only via sendMessage ---
      const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: caption }),
      });

      const msgJson = await msgRes.json();

      if (!msgJson.ok) {
        return NextResponse.json(
          { success: false, message: msgJson.description || "Telegram sendMessage failed" },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, foto_url: "" });
    }
  } catch (err) {
    console.error("[report] Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

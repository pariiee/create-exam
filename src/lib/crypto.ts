import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Key harus 32 bytes untuk AES-256. Pakai SHA-256 hash supaya panjangnya pasti 32 bytes.
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt plaintext menggunakan AES-256-CBC.
 * Output format: iv:encrypted (hex:hex)
 * APK bisa decrypt dengan memisahkan iv dan encrypted text.
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

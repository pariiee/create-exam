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
 * Cek apakah string sudah dalam format encrypted (iv:hex).
 */
export function isEncrypted(text: string): boolean {
  if (!text || !text.includes(":")) return false;
  const parts = text.split(":");
  if (parts.length !== 2) return false;
  // IV = 16 bytes = 32 hex chars, encrypted part juga hex
  return /^[0-9a-f]{32}$/.test(parts[0]) && /^[0-9a-f]+$/.test(parts[1]);
}

/**
 * Encrypt plaintext menggunakan AES-256-CBC.
 * Output format: iv:encrypted (hex:hex)
 * APK bisa decrypt dengan memisahkan iv dan encrypted text.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt ciphertext (format iv:encrypted) kembali ke plaintext.
 */
export function decrypt(text: string): string {
  if (!text || !isEncrypted(text)) return text;
  const key = getEncryptionKey();
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

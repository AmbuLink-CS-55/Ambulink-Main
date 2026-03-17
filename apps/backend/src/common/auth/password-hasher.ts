import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [algorithm, salt, hashHex] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hashHex) {
    return false;
  }

  const actual = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, actual.length);

  if (actual.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(actual, derived);
}

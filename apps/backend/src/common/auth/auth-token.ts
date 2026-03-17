import { createHmac, timingSafeEqual } from "crypto";
import env from "env";
import type { AuthTokenPayload, AuthUser } from "./auth.types";

const header = {
  alg: "HS256",
  typ: "JWT",
} as const;

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    const fallback = Number.parseInt(duration, 10);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 24 * 60 * 60;
  }

  const count = Number.parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "s") return count;
  if (unit === "m") return count * 60;
  if (unit === "h") return count * 60 * 60;
  return count * 24 * 60 * 60;
}

function getSecret(): string {
  return env.JWT_SECRET ?? "dev-only-jwt-secret-change-this-in-production";
}

export function signAuthToken(user: AuthUser): { accessToken: string; expiresInSeconds: number } {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = parseDurationToSeconds(env.JWT_EXPIRATION);
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    providerId: user.providerId,
    email: user.email,
    fullName: user.fullName,
    isDispatcherAdmin: user.isDispatcherAdmin,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", getSecret()).update(unsigned).digest();

  return {
    accessToken: `${unsigned}.${base64UrlEncode(signature)}`,
    expiresInSeconds,
  };
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", getSecret()).update(unsigned).digest();
  const actualSignature = Buffer.from(
    encodedSignature.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedSignature.length / 4) * 4, "="),
    "base64"
  );

  if (actualSignature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(actualSignature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp < now) {
      return null;
    }
    if (!decoded.sub || !decoded.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

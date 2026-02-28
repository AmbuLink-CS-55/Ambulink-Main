import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import env from "../../../env";
import type { AuthUser } from "./auth.types";

@Injectable()
export class TokenService {
  private readonly secret = env.JWT_SECRET;

  verify(token: string): AuthUser {
    if (!this.secret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid token format");
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.sign(`${header}.${payload}`);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException("Invalid token signature");
    }

    let parsedPayload: AuthUser;
    try {
      parsedPayload = JSON.parse(this.fromBase64Url(payload)) as AuthUser;
    } catch {
      throw new UnauthorizedException("Invalid token payload");
    }

    if (!parsedPayload.sub || !parsedPayload.role) {
      throw new UnauthorizedException("Missing token claims");
    }

    if (parsedPayload.exp && Date.now() >= parsedPayload.exp * 1000) {
      throw new UnauthorizedException("Token expired");
    }

    return parsedPayload;
  }

  // Kept for tests and local tooling until a dedicated auth service is introduced.
  signUser(payload: AuthUser): string {
    const header = this.toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = this.toBase64Url(JSON.stringify(payload));
    const signature = this.sign(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  private sign(value: string) {
    return createHmac("sha256", this.secret ?? "")
      .update(value)
      .digest("base64url");
  }

  private toBase64Url(value: string) {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  private fromBase64Url(value: string) {
    return Buffer.from(value, "base64url").toString("utf8");
  }
}

import type { UserRole } from "@/core/database/schema";

export type AuthUser = {
  id: string;
  role: UserRole;
  providerId: string | null;
  email: string | null;
  fullName: string | null;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  providerId: string | null;
  email: string | null;
  fullName: string | null;
  exp: number;
  iat: number;
};

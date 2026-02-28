import type { UserRole } from "@/core/database/schema";

export type AuthUser = {
  sub: string;
  role: UserRole;
  providerId?: string | null;
  iat?: number;
  exp?: number;
};

import type { UserRole } from "@/common/database/schema";

export type AuthUser = {
  sub: string;
  role: UserRole;
  providerId?: string | null;
  iat?: number;
  exp?: number;
};

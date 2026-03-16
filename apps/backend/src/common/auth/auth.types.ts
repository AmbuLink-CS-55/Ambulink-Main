import type { UserRole } from "@/core/database/schema";

export type AuthUser = {
  id: string;
  role: UserRole;
  providerId: string | null;
  email: string | null;
  fullName: string | null;
  isDispatcherAdmin: boolean;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  providerId: string | null;
  email: string | null;
  fullName: string | null;
  isDispatcherAdmin: boolean;
  exp: number;
  iat: number;
};

import env, { seedEnv } from "../../../env";
import type { AuthUser } from "./auth.types";
import type { UserRole } from "@/core/database/schema";
import type { Socket } from "socket.io";

export function isAuthBypassed() {
  return env.APP_STAGE === "dev" || env.AUTH_DISABLED;
}

export function buildDevHttpUser(requiredRoles?: UserRole[]): AuthUser {
  const role = requiredRoles?.[0] ?? "PATIENT";
  return {
    sub: getSeedIdForRole(role),
    role,
    providerId: seedEnv.PROVIDER_ID ?? null,
  };
}

export function buildDevSocketUser(client: Socket, roles: UserRole[]): AuthUser {
  const role = roles[0] ?? "PATIENT";
  return {
    sub: getSocketIdForRole(client, role) ?? getSeedIdForRole(role),
    role,
    providerId: seedEnv.PROVIDER_ID ?? null,
  };
}

function getSeedIdForRole(role: UserRole): string {
  switch (role) {
    case "DRIVER":
      return seedEnv.DRIVER_ID ?? "56a6c9f6-ce95-4752-aa58-beb2ddf6f553";
    case "DISPATCHER":
      return seedEnv.DISPATCHER_ID ?? "298e5c8e-262f-49a3-8cf6-9ff6e82c59dd";
    case "PATIENT":
      return seedEnv.PATIENT_ID ?? "74dbca42-1669-48ec-a858-a8cf6e99a8cb";
    case "EMT":
      return seedEnv.DRIVER_ID ?? "56a6c9f6-ce95-4752-aa58-beb2ddf6f553";
    default:
      return seedEnv.PATIENT_ID ?? "74dbca42-1669-48ec-a858-a8cf6e99a8cb";
  }
}

function getSocketIdForRole(client: Socket, role: UserRole): string | undefined {
  const auth = (client.handshake.auth ?? {}) as Record<string, unknown>;
  if (role === "DRIVER") {
    return asString(auth.driverId);
  }
  if (role === "PATIENT") {
    return asString(auth.patientId);
  }
  if (role === "DISPATCHER") {
    return asString(auth.dispatcherId);
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

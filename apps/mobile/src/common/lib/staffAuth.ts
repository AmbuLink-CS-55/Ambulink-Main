import { apiGet, apiPost } from "./api";

export type MobileStaffRole = "DRIVER" | "EMT";

type StaffUser = {
  id: string;
  role: "DISPATCHER" | "DRIVER" | "EMT";
  email: string | null;
  fullName: string | null;
  providerId: string | null;
};

export type StaffAuthResponse = {
  accessToken: string;
  expiresInSeconds: number;
  user: StaffUser;
};

export async function loginStaff(payload: {
  role: MobileStaffRole;
  email: string;
  password: string;
}) {
  return apiPost<StaffAuthResponse, typeof payload>("/api/auth/staff/login", payload);
}

export async function signupStaff(payload: {
  role: MobileStaffRole;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  inviteToken?: string;
  providerId?: string;
}) {
  return apiPost<StaffAuthResponse, typeof payload>("/api/auth/staff/signup", payload);
}

export type StaffInvitePreview = {
  valid: boolean;
  role: "DISPATCHER" | "DRIVER" | "EMT" | null;
  invitedEmail: string | null;
  expiresAt: string | null;
};

export async function previewStaffInvite(inviteToken: string) {
  return apiGet<StaffInvitePreview>("/api/auth/staff/invites/preview", {
    inviteToken,
  });
}

export async function activateStaffInvite(payload: {
  inviteToken: string;
  password: string;
  confirmPassword: string;
}) {
  return apiPost<StaffAuthResponse, typeof payload>("/api/auth/staff/invites/activate", payload);
}

export async function startGuestBooking(payload: {
  x: number;
  y: number;
  patientSettings: Record<string, unknown>;
}) {
  return apiPost<{
    accessToken: string;
    expiresInSeconds: number;
    patient: { id: string; email: string | null; fullName: string | null };
    guestSession: { id: string; bookingId: string | null; expiresAt: string; status: string } | null;
  }, typeof payload>("/api/patients/events/guest-bookings/start", payload);
}

export function toMobileAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  if (/request failed/i.test(error.message) || /^<html/i.test(error.message.trim())) {
    return fallback;
  }

  return error.message;
}

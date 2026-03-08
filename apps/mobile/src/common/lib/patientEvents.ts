import { apiPost, apiPostForm } from "./api";
import type { PatientCancelCommand, PatientHelpCommand } from "@ambulink/types";
import { env } from "../../../env";
import { buildMediaFormData, type MediaAttachmentInput, type MediaNoteSubmitPayload } from "./mediaNote";

export async function sendPatientHelp(payload: PatientHelpCommand) {
  return apiPost<{ accepted: boolean }, PatientHelpCommand>("/api/patients/events/help", payload, {
    patientId: env.EXPO_PUBLIC_PATIENT_ID,
  });
}

export async function sendPatientCancel(payload: PatientCancelCommand) {
  return apiPost<{ accepted: boolean }, PatientCancelCommand>(
    "/api/patients/events/cancel",
    payload,
    {
      patientId: env.EXPO_PUBLIC_PATIENT_ID,
    }
  );
}

export async function startPatientUploadSession(patientId: string = env.EXPO_PUBLIC_PATIENT_ID) {
  return apiPost<{ uploadSessionId: string; expiresAt: string }, Record<string, never>>(
    "/api/patients/events/upload-session/start",
    {},
    { patientId }
  );
}

export async function uploadPatientSessionFiles(payload: {
  sessionId: string;
  patientId?: string;
  content?: string;
  durationMs?: number;
  files: MediaAttachmentInput[];
}) {
  const formData = buildMediaFormData({
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files,
  });

  return apiPostForm<{ noteId: string }>(
    `/api/patients/events/upload-session/${payload.sessionId}/files`,
    formData,
    { patientId: payload.patientId ?? env.EXPO_PUBLIC_PATIENT_ID }
  );
}

export async function uploadPatientBookingNote(payload: {
  bookingId: string;
  patientId?: string;
  content?: string;
  durationMs?: number;
  files: MediaAttachmentInput[];
}) {
  const formData = buildMediaFormData({
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files,
  });

  return apiPostForm<{ note: unknown }>(
    `/api/patients/events/booking/${payload.bookingId}/notes`,
    formData,
    { patientId: payload.patientId ?? env.EXPO_PUBLIC_PATIENT_ID }
  );
}

export async function submitPatientMediaNote(payload: {
  patientId?: string;
  bookingId?: string;
  sessionId?: string;
  content?: string;
  durationMs?: number;
  files: MediaAttachmentInput[];
}) {
  if (payload.bookingId) {
    return uploadPatientBookingNote({
      bookingId: payload.bookingId,
      patientId: payload.patientId,
      content: payload.content,
      durationMs: payload.durationMs,
      files: payload.files,
    });
  }

  if (!payload.sessionId) {
    throw new Error("sessionId is required when bookingId is not provided");
  }

  return uploadPatientSessionFiles({
    sessionId: payload.sessionId,
    patientId: payload.patientId,
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files,
  });
}

export const createPatientMediaSubmitAdapter =
  (params: { bookingId?: string | null; sessionId?: string | null; patientId?: string }) =>
  async (payload: MediaNoteSubmitPayload) => {
    await submitPatientMediaNote({
      patientId: params.patientId ?? env.EXPO_PUBLIC_PATIENT_ID,
      bookingId: params.bookingId ?? undefined,
      sessionId: params.sessionId ?? undefined,
      ...payload,
    });
  };

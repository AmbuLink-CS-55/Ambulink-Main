import { apiPost, apiPostForm } from "./api";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import {
  buildMediaFormData,
  type MediaAttachmentInput,
  type MediaNoteSubmitPayload,
} from "./mediaNote";

export async function sendPatientHelp(payload: PatientPickupRequest) {
  return apiPost<{ accepted: boolean }, PatientPickupRequest>("/api/patients/events/help", payload);
}

export async function sendPatientCancel(payload: PatientCancelRequest) {
  return apiPost<{ accepted: boolean }, PatientCancelRequest>(
    "/api/patients/events/cancel",
    payload
  );
}

export async function startPatientUploadSession() {
  return apiPost<{ uploadSessionId: string; expiresAt: string }, Record<string, never>>(
    "/api/patients/events/upload-session/start",
    {}
  );
}

export async function uploadPatientSessionFiles(payload: {
  sessionId: string;
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
    formData
  );
}

export async function uploadPatientBookingNote(payload: {
  bookingId: string;
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
    formData
  );
}

export async function submitPatientMediaNote(payload: {
  bookingId?: string;
  sessionId?: string;
  content?: string;
  durationMs?: number;
  files: MediaAttachmentInput[];
}) {
  if (payload.bookingId) {
    return uploadPatientBookingNote({
      bookingId: payload.bookingId,
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
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files,
  });
}

export const createPatientMediaSubmitAdapter =
  (params: { bookingId?: string | null; sessionId?: string | null }) =>
  async (payload: MediaNoteSubmitPayload) => {
    await submitPatientMediaNote({
      bookingId: params.bookingId ?? undefined,
      sessionId: params.sessionId ?? undefined,
      ...payload,
    });
  };

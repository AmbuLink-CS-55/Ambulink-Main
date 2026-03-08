import { apiGet, apiPost, apiPostForm } from "./api";
import { env } from "../../../env";
import type { BookingAssignedPayload, EmtBookingSearchResult, EmtNote } from "@ambulink/types";
import { buildMediaFormData, type MediaAttachmentInput, type MediaNoteSubmitPayload } from "./mediaNote";

export async function fetchEmtBookingOptions(
  emtId: string = env.EXPO_PUBLIC_EMT_ID
): Promise<EmtBookingSearchResult[]> {
  return apiGet<EmtBookingSearchResult[]>("/api/emts/bookings/search", {
    emtId,
  });
}

export async function fetchEmtCurrentBooking(
  emtId: string = env.EXPO_PUBLIC_EMT_ID
): Promise<BookingAssignedPayload | null> {
  const response = await apiGet<{ booking: BookingAssignedPayload | null }>(
    "/api/emts/events/current",
    {
      emtId,
    }
  );

  return response.booking;
}

export async function postEmtSubscribe(payload: {
  bookingId: string;
  emtId?: string;
}): Promise<BookingAssignedPayload> {
  const response = await apiPost<{ booking: BookingAssignedPayload }, { bookingId: string }>(
    "/api/emts/events/subscribe",
    { bookingId: payload.bookingId },
    {
      emtId: payload.emtId ?? env.EXPO_PUBLIC_EMT_ID,
    }
  );

  return response.booking;
}

export async function submitEmtMediaNote(payload: {
  bookingId: string;
  content?: string;
  durationMs?: number;
  files?: MediaAttachmentInput[];
  emtId?: string;
}): Promise<EmtNote> {
  const formData = buildMediaFormData({
    fields: { bookingId: payload.bookingId },
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files ?? [],
  });

  const response = await apiPostForm<{ note: EmtNote }>(
    "/api/emts/events/notes",
    formData,
    { emtId: payload.emtId ?? env.EXPO_PUBLIC_EMT_ID }
  );

  return response.note;
}

export async function postEmtNote(payload: {
  bookingId: string;
  content?: string;
  durationMs?: number;
  files?: MediaAttachmentInput[];
  emtId?: string;
}): Promise<EmtNote> {
  return submitEmtMediaNote(payload);
}

export const createEmtMediaSubmitAdapter =
  (params: { bookingId: string; emtId?: string }) =>
  async (payload: MediaNoteSubmitPayload) => {
    await submitEmtMediaNote({
      bookingId: params.bookingId,
      emtId: params.emtId ?? env.EXPO_PUBLIC_EMT_ID,
      ...payload,
    });
  };

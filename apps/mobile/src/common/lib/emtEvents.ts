import { apiGet, apiPost, apiPostForm } from "./api";
import type { BookingAssignedPayload, EmtBookingSearchResult, EmtNote } from "@ambulink/types";
import {
  buildMediaFormData,
  type MediaAttachmentInput,
  type MediaNoteSubmitPayload,
} from "./mediaNote";
import { getAuthUser } from "@/common/hooks/AuthContext";

function resolveEmtId(emtId?: string) {
  const fromSession = getAuthUser()?.id;
  const id = emtId ?? fromSession;
  if (!id) {
    throw new Error("EMT session is required");
  }
  return id;
}

export async function fetchEmtBookingOptions(
  emtId?: string
): Promise<EmtBookingSearchResult[]> {
  return apiGet<EmtBookingSearchResult[]>("/api/emts/bookings/search", {
    emtId: resolveEmtId(emtId),
  });
}

export async function fetchEmtCurrentBooking(
  emtId?: string
): Promise<BookingAssignedPayload | null> {
  const response = await apiGet<{ booking: BookingAssignedPayload | null }>(
    "/api/emts/events/current",
    {
      emtId: resolveEmtId(emtId),
    }
  );

  return response.booking;
}

export async function postEmtSubscribe(payload: {
  bookingId: string;
  emtId?: string;
}): Promise<BookingAssignedPayload> {
  const emtId = resolveEmtId(payload.emtId);
  const response = await apiPost<{ booking: BookingAssignedPayload }, { bookingId: string }>(
    "/api/emts/events/subscribe",
    { bookingId: payload.bookingId },
    {
      emtId,
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
  const emtId = resolveEmtId(payload.emtId);
  const formData = buildMediaFormData({
    fields: { bookingId: payload.bookingId },
    content: payload.content,
    durationMs: payload.durationMs,
    files: payload.files ?? [],
  });

  const response = await apiPostForm<{ note: EmtNote }>("/api/emts/events/notes", formData, {
    emtId,
  });

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
  (params: { bookingId: string; emtId?: string }) => async (payload: MediaNoteSubmitPayload) => {
    await submitEmtMediaNote({
      bookingId: params.bookingId,
      emtId: params.emtId,
      ...payload,
    });
  };

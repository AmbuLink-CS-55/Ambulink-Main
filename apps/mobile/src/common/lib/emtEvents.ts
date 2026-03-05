import { apiGet, apiPost } from "./api";
import { env } from "../../../env";
import type { BookingAssignedPayload, EmtBookingSearchResult, EmtNote } from "@ambulink/types";

const UUID_PREFIXES = "0123456789abcdef".split("");

export async function fetchEmtBookingOptions(
  emtId: string = env.EXPO_PUBLIC_EMT_ID
): Promise<EmtBookingSearchResult[]> {
  const responses = await Promise.all(
    UUID_PREFIXES.map((prefix) =>
      apiGet<EmtBookingSearchResult[]>("/api/emts/bookings/search", {
        emtId,
        q: prefix,
        limit: 20,
      }).catch(() => [])
    )
  );

  const deduped = new Map<string, EmtBookingSearchResult>();
  for (const group of responses) {
    for (const entry of group) {
      if (!deduped.has(entry.bookingId)) {
        deduped.set(entry.bookingId, entry);
      }
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.bookingId.localeCompare(b.bookingId));
}

export async function fetchEmtCurrentBooking(
  emtId: string = env.EXPO_PUBLIC_EMT_ID
): Promise<BookingAssignedPayload | null> {
  const response = await apiGet<{ booking: BookingAssignedPayload | null }>("/api/emts/events/current", {
    emtId,
  });

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

export async function postEmtNote(payload: {
  bookingId: string;
  content: string;
  emtId?: string;
}): Promise<EmtNote> {
  const response = await apiPost<{ note: EmtNote }, { bookingId: string; content: string }>(
    "/api/emts/events/notes",
    {
      bookingId: payload.bookingId,
      content: payload.content,
    },
    {
      emtId: payload.emtId ?? env.EXPO_PUBLIC_EMT_ID,
    }
  );

  return response.note;
}

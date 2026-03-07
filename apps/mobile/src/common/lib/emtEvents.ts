import { apiGet, apiPost } from "./api";
import { env } from "../../../env";
import type { BookingAssignedPayload, EmtBookingSearchResult, EmtNote } from "@ambulink/types";

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

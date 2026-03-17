import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BookingDetailsPayload, BookingLogEntry, BookingNote, Point } from "@ambulink/types";

export type { BookingLogEntry };

export const useGetBookingLog = () => {
  return useQuery({
    queryKey: queryKeys.bookingLog(null),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<BookingLogEntry[]>("/booking");
      return data;
    },
  });
};

export const useGetBookingDetails = (bookingId: string | null) => {
  return useQuery({
    queryKey: queryKeys.bookingDetails(bookingId ?? "none"),
    enabled: Boolean(bookingId),
    queryFn: async () => {
      if (!bookingId) {
        throw new Error("Booking ID is required");
      }
      const { data } = await api.get<BookingDetailsPayload>(`/booking/${bookingId}/details`);
      return data;
    },
  });
};

export const useAddBookingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bookingId: string; content: string }) => {
      const { data } = await api.post<BookingNote>(`/booking/${payload.bookingId}/notes`, {
        content: payload.content,
      });
      return data;
    },
    onSuccess: async (_note, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookingDetails(variables.bookingId),
      });
    },
  });
};

export const useReassignBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: {
        driverId?: string;
        hospitalId?: string;
        pickupLocation?: Point;
        pickupAddress?: string | null;
      };
    }) => {
      const { data } = await api.patch(`/booking/${bookingId}/reassign`, payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ongoingBookings() });
    },
  });
};

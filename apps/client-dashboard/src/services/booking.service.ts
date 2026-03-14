import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BookingDetailsPayload, BookingLogEntry, Point } from "@ambulink/types";

export type { BookingLogEntry };

export const useGetBookingLog = (params?: { providerId?: string }) => {
  return useQuery({
    queryKey: queryKeys.bookingLog(params?.providerId ?? null),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<BookingLogEntry[]>("/booking", { params });
      return data;
    },
  });
};

export const useGetBookingDetails = (bookingId: string | null, dispatcherId?: string) => {
  return useQuery({
    queryKey: queryKeys.bookingDetails(bookingId ?? "none"),
    enabled: Boolean(bookingId && dispatcherId),
    queryFn: async () => {
      if (!bookingId || !dispatcherId) {
        throw new Error("Booking ID and dispatcher ID are required");
      }
      const { data } = await api.get<BookingDetailsPayload>(`/booking/${bookingId}/details`, {
        params: { dispatcherId },
      });
      return data;
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
        dispatcherId: string;
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

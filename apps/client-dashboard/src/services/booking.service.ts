import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BookingLogEntry, Point } from "@ambulink/types";

export type { BookingLogEntry };

export const useGetBookingLog = (params?: { providerId?: string; status?: string }) => {
  return useQuery({
    queryKey: queryKeys.bookingLog(params?.providerId ?? null),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<BookingLogEntry[]>("/booking", { params });
      return data;
    },
  });
};

export const useManualAssignBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      dispatcherId: string;
      driverId: string;
      hospitalId: string;
      pickupLocation: Point;
      pickupAddress?: string | null;
      emergencyType?: string | null;
      patientId?: string;
      patientPhoneNumber?: string | null;
      patientEmail?: string | null;
    }) => {
      const { data } = await api.post("/booking/manual-assign", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ongoingBookings() });
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

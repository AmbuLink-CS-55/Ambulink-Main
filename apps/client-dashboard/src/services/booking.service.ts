import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Point } from "@/lib/types";

export type BookingLogEntry = {
  bookingId: string;
  status: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
  updatedAt?: string | null;
  fareEstimate: string | null;
  fareFinal: string | null;
  cancellationReason: string | null;
  patientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  ambulanceId: string | null;
  providerId: string | null;
  providerName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
};

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

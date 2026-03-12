import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BookingDetailsPayload,
  BookingInsightsAnalytics,
  BookingLogEntry,
  BookingNote,
  BookingResponseAnalytics,
  BookingZonesAnalytics,
  Point,
} from "@ambulink/types";

export type { BookingLogEntry };

export const useGetBookingLog = (params?: { providerId?: string; status?: string }) => {
  return useQuery({
    queryKey: queryKeys.bookingLog(params?.providerId ?? null, params?.status ?? null),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<BookingLogEntry[]>("/booking", { params });
      return data;
    },
  });
};

type BookingAnalyticsQuery = {
  dispatcherId: string;
  from?: string;
  to?: string;
};

export const useBookingResponseAnalytics = (params: BookingAnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.bookingResponseAnalytics(params.dispatcherId, params.from, params.to),
    enabled: Boolean(params.dispatcherId),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<BookingResponseAnalytics>("/booking/analytics/response", {
        params,
      });
      return data;
    },
  });
};

export const useBookingZonesAnalytics = (params: BookingAnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.bookingZonesAnalytics(params.dispatcherId, params.from, params.to),
    enabled: Boolean(params.dispatcherId),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<BookingZonesAnalytics>("/booking/analytics/zones", {
        params,
      });
      return data;
    },
  });
};

export const useBookingInsightsAnalytics = (params: BookingAnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.bookingInsightsAnalytics(params.dispatcherId, params.from, params.to),
    enabled: Boolean(params.dispatcherId),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<BookingInsightsAnalytics>("/booking/analytics/insights", {
        params,
      });
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
      await queryClient.invalidateQueries({ queryKey: ["booking-log"] });
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

export const useAddBookingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bookingId: string; dispatcherId: string; content: string }) => {
      const { data } = await api.post<BookingNote>(`/booking/${payload.bookingId}/notes`, {
        dispatcherId: payload.dispatcherId,
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

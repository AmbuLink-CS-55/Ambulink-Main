import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type BookingLogEntry = {
  bookingId: string;
  status: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
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

type BookingLogParams = {
  providerId?: string;
  status?: string;
};

export const useGetBookingLog = (params?: BookingLogParams) => {
  return useQuery({
    queryKey: ["booking-log", params],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<BookingLogEntry[]>("/booking", { params });
      return data;
    },
  });
};

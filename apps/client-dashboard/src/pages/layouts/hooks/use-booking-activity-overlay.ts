import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBookingRequests } from "@/pages/dashboard/hooks/use-booking-requests";
import { useBookingOverlayTimers } from "@/pages/layouts/hooks/use-booking-overlay-timers";
import { useOngoingBookingRoutes } from "@/pages/dashboard/hooks/use-ongoing-booking-routes";
import { setPendingBookingDecision } from "@/lib/booking-cache-ops";
import type { BookingDecisionState } from "@/lib/booking-types";
import { queryKeys } from "@/lib/queryKeys";
import type {
  DispatcherBookingPayload,
  DispatcherToServerEvents,
  ServerToDispatcherEvents,
} from "@/lib/socket-types";

type DispatcherSocket = import("socket.io-client").Socket<
  ServerToDispatcherEvents,
  DispatcherToServerEvents
>;

export function useBookingActivityOverlay(socket?: DispatcherSocket) {
  const queryClient = useQueryClient();
  const { bookingRequests } = useBookingRequests();
  const ongoingBookingsQuery = useQuery<Record<string, DispatcherBookingPayload>>({
    queryKey: queryKeys.ongoingBookings(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const bookingDecisionsQuery = useQuery<Record<string, BookingDecisionState>>({
    queryKey: queryKeys.bookingDecisions(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });

  const ongoingBookings = ongoingBookingsQuery.data ?? {};
  const bookingDecisions = bookingDecisionsQuery.data ?? {};
  const [selectedBooking, setSelectedBooking] = useState<DispatcherBookingPayload | null>(null);
  const { ongoingList, durations } = useOngoingBookingRoutes(ongoingBookings);

  useBookingOverlayTimers({
    bookingRequests,
    bookingDecisions,
    queryClient,
  });

  const handleAccept = useCallback(
    (requestId: string) => {
      if (!socket?.connected) return;
      setPendingBookingDecision(queryClient, requestId);
      socket.emit("booking:decision-submit", { requestId, approved: true });
    },
    [queryClient, socket]
  );

  const handleReject = useCallback(
    (requestId: string) => {
      if (!socket?.connected) return;
      setPendingBookingDecision(queryClient, requestId);
      socket.emit("booking:decision-submit", { requestId, approved: false });
    },
    [queryClient, socket]
  );

  return {
    bookingRequests,
    bookingDecisions,
    ongoingList,
    durations,
    selectedBooking,
    setSelectedBooking,
    handleAccept,
    handleReject,
  };
}

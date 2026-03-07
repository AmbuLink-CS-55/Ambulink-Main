import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BookingDecisionState, BookingRequestEntity } from "@/lib/booking-types";
import type { BookingDecisionPayload } from "@/lib/socket-types";

export function upsertBookingRequest(queryClient: QueryClient, request: BookingRequestEntity) {
  queryClient.setQueryData(queryKeys.bookingRequest(request.requestId), request);
  queryClient.setQueryData<string[]>(queryKeys.bookingRequestIds(), (prev = []) => {
    if (prev.includes(request.requestId)) return prev;
    return [...prev, request.requestId];
  });
}

export function removeBookingRequest(queryClient: QueryClient, requestId: string) {
  queryClient.setQueryData<string[]>(queryKeys.bookingRequestIds(), (prev = []) =>
    prev.filter((id) => id !== requestId)
  );
  queryClient.removeQueries({ queryKey: queryKeys.bookingRequest(requestId), exact: true });
}

export function setBookingDecision(queryClient: QueryClient, payload: BookingDecisionPayload) {
  queryClient.setQueryData<Record<string, BookingDecisionState>>(
    queryKeys.bookingDecisions(),
    (prev = {}) => ({
      ...prev,
      [payload.requestId]: {
        status: payload.isWinner ? "won" : "lost",
        winner: payload.winner,
      },
    })
  );
}

export function setPendingBookingDecision(queryClient: QueryClient, requestId: string) {
  queryClient.setQueryData<Record<string, BookingDecisionState>>(
    queryKeys.bookingDecisions(),
    (prev = {}) => ({
      ...prev,
      [requestId]: {
        status: "pending",
        winner: { id: "", name: null, providerName: null },
      },
    })
  );
}

export function clearBookingDecision(queryClient: QueryClient, requestId: string) {
  queryClient.setQueryData<Record<string, BookingDecisionState>>(
    queryKeys.bookingDecisions(),
    (prev = {}) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    }
  );
}

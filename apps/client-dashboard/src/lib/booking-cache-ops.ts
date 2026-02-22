import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BookingDecisionState, BookingRequestEntity } from "@/lib/booking-types";
import type { BookingDecisionPayload } from "@/lib/socket-types";
import {
  clearBookingRequestCallbacks,
  removeBookingRequestCallback,
} from "@/lib/booking-request-callbacks";

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
  removeBookingRequestCallback(requestId);
}

export function clearBookingRequests(queryClient: QueryClient) {
  const requestIds = queryClient.getQueryData<string[]>(queryKeys.bookingRequestIds()) ?? [];
  requestIds.forEach((requestId) => {
    queryClient.removeQueries({ queryKey: queryKeys.bookingRequest(requestId), exact: true });
  });
  queryClient.setQueryData<string[]>(queryKeys.bookingRequestIds(), []);
  clearBookingRequestCallbacks();
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

export function clearBookingDecisions(queryClient: QueryClient) {
  queryClient.setQueryData<Record<string, BookingDecisionState>>(queryKeys.bookingDecisions(), {});
}

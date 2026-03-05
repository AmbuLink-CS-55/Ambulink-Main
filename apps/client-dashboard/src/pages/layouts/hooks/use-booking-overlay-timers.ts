import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { BookingDecisionState, BookingRequestEntity } from "@/lib/booking-types";
import { clearBookingDecision, removeBookingRequest } from "@/lib/booking-cache-ops";

const LOST_DECISION_HOLD_MS = 5000;

export function useBookingOverlayTimers({
  bookingRequests,
  bookingDecisions,
  queryClient,
}: {
  bookingRequests: BookingRequestEntity[];
  bookingDecisions: Record<string, BookingDecisionState>;
  queryClient: QueryClient;
}) {
  useEffect(() => {
    const requestTimeouts = bookingRequests.map((request) => {
      const remaining = Math.max(request.expiresAt - Date.now(), 0);

      if (remaining === 0) {
        removeBookingRequest(queryClient, request.requestId);
        clearBookingDecision(queryClient, request.requestId);
        return null;
      }

      return setTimeout(() => {
        removeBookingRequest(queryClient, request.requestId);
        clearBookingDecision(queryClient, request.requestId);
      }, remaining);
    });

    const decisionTimeouts = Object.entries(bookingDecisions)
      .filter(([, decision]) => ["won", "lost"].includes(decision.status))
      .map(([requestId, decision]) =>
        setTimeout(
          () => {
            removeBookingRequest(queryClient, requestId);
            clearBookingDecision(queryClient, requestId);
          },
          decision.status === "won" ? 0 : LOST_DECISION_HOLD_MS
        )
      );

    return () => {
      requestTimeouts.forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      decisionTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [bookingDecisions, bookingRequests, queryClient]);
}

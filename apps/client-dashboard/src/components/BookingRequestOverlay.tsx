import { useCallback, useState } from "react";
import { Bell, Truck, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useBookingRequests } from "@/hooks/use-booking-requests";
import { useBookingOverlayTimers } from "@/hooks/use-booking-overlay-timers";
import { useOngoingBookingRoutes } from "@/hooks/use-ongoing-booking-routes";
import {
  clearBookingDecision,
  removeBookingRequest,
  setPendingBookingDecision,
} from "@/lib/booking-cache-ops";
import { resolveBookingRequestCallback } from "@/lib/booking-request-callbacks";
import type { BookingDecisionState } from "@/lib/booking-types";
import { queryKeys } from "@/lib/queryKeys";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { cn } from "@/lib/utils";
import { MemoizedBookingRequestsSection } from "@/components/booking-overlay/BookingRequestsSection";
import { OngoingBookingsSection } from "@/components/booking-overlay/OngoingBookingsSection";
import { ReassignBookingDialog } from "@/components/booking-overlay/ReassignBookingDialog";

export function BookingRequestOverlay({ socketConnected }: { socketConnected?: boolean }) {
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

  const [isOpen, setIsOpen] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<DispatcherBookingPayload | null>(null);

  const { ongoingList, durations } = useOngoingBookingRoutes(ongoingBookings);

  useBookingOverlayTimers({
    bookingRequests,
    bookingDecisions,
    queryClient,
  });

  const handleAccept = useCallback(
    (requestId: string) => {
      resolveBookingRequestCallback(requestId, true);
      setPendingBookingDecision(queryClient, requestId);
    },
    [queryClient]
  );

  const handleReject = useCallback(
    (requestId: string) => {
      resolveBookingRequestCallback(requestId, false);
      removeBookingRequest(queryClient, requestId);
      clearBookingDecision(queryClient, requestId);
    },
    [queryClient]
  );

  return (
    <>
      <div className="fixed top-2 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse booking activity panel" : "Open booking activity panel"}
          className="relative shadow-[var(--amb-shadow-medium)]"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Truck />}
          {bookingRequests.length > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[color:var(--amb-critical)] text-[color:var(--amb-surface)] text-xs flex items-center justify-center font-semibold">
              {bookingRequests.length}
            </span>
          ) : null}
        </Button>
      </div>

      <div
        className={cn(
          "fixed top-2 bottom-2 right-2 h-auto w-96 rounded-2xl border border-[color:var(--amb-border)] bg-[color:var(--amb-surface)]/85 shadow-[var(--amb-shadow-high)] backdrop-blur-md z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="items-center w-full justify-between p-3 border-b border-[color:var(--amb-border)]">
            <h1 className="font-bold text-xl items-center text-center ">Activity</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {bookingRequests.length === 0 && ongoingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">
                  {socketConnected === false ? "Disconnected" : "No pending requests"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <OngoingBookingsSection
                  ongoingList={ongoingList}
                  etaDurations={durations}
                  onReassign={(booking) => setSelectedBooking(booking)}
                />
                <MemoizedBookingRequestsSection
                  bookingRequests={bookingRequests}
                  bookingDecisions={bookingDecisions}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isOpen && bookingRequests.length > 0 ? (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <ReassignBookingDialog
        booking={selectedBooking}
        open={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  );
}

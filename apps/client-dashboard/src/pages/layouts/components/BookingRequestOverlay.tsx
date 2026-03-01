import { useCallback, useState } from "react";
import { Bell, Truck, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useBookingRequests } from "@/pages/dashboard/hooks/use-booking-requests";
import { useBookingOverlayTimers } from "@/pages/layouts/hooks/use-booking-overlay-timers";
import { useOngoingBookingRoutes } from "@/pages/dashboard/hooks/use-ongoing-booking-routes";
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
import { MemoizedBookingRequestsSection } from "@/pages/layouts/components/booking-overlay/BookingRequestsSection";
import { OngoingBookingsSection } from "@/pages/layouts/components/booking-overlay/OngoingBookingsSection";
import { ReassignBookingDialog } from "@/pages/layouts/components/booking-overlay/ReassignBookingDialog";

export function BookingRequestOverlay({ socketConnected }: { socketConnected?: boolean }) {
  const panelId = "booking-activity-panel";
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
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="relative shadow-[var(--shadow-md)]"
        >
          {isOpen ? (
            <X className="h-4 w-4 text-[color:var(--primary-foreground)]" />
          ) : (
            <Truck className="h-4 w-4 text-[color:var(--primary-foreground)]" />
          )}
          {bookingRequests.length > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[color:var(--destructive)] text-[color:var(--card)] text-xs flex items-center justify-center font-semibold">
              {bookingRequests.length}
            </span>
          ) : null}
        </Button>
      </div>

      <div
        id={panelId}
        className={cn(
          "fixed top-0 bottom-2 right-2 h-auto w-96 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-lg)] z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex h-14 w-full items-center justify-center border-b border-[color:var(--border)] px-4">
            <h2 className="text-center text-xl font-bold leading-none">Activity</h2>
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
          className="fixed inset-0 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden
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

import { Bell, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "@/lib/socket-types";
import { cn } from "@/lib/utils";
import { useDashboardUrlState } from "@/hooks/use-dashboard-url-state";
import { MemoizedBookingRequestsSection } from "@/pages/layouts/components/booking-overlay/BookingRequestsSection";
import { OngoingBookingsSection } from "@/pages/layouts/components/booking-overlay/OngoingBookingsSection";
import { ReassignBookingDialog } from "@/pages/layouts/components/booking-overlay/ReassignBookingDialog";
import { useBookingActivityOverlay } from "@/pages/layouts/hooks/use-booking-activity-overlay";

type DispatcherSocket = import("socket.io-client").Socket<
  ServerToDispatcherEvents,
  DispatcherToServerEvents
>;

export function BookingRequestOverlay({
  socketConnected,
  socket,
}: {
  socketConnected?: boolean;
  socket?: DispatcherSocket;
}) {
  const panelId = "booking-activity-panel";
  const { overviewOpen, setOverviewOpen, overviewTab, setOverviewTab } = useDashboardUrlState();
  const {
    bookingRequests,
    bookingDecisions,
    ongoingList,
    durations,
    selectedBooking,
    setSelectedBooking,
    handleAccept,
    handleReject,
  } = useBookingActivityOverlay(socket);
  const hasRequests = bookingRequests.length > 0;
  const hasOngoing = ongoingList.length > 0;
  const hasAny = hasRequests || hasOngoing;

  return (
    <>
      <div className="fixed top-2 right-4 z-30">
        <Button
          variant="default"
          size="icon"
          onClick={() => setOverviewOpen(!overviewOpen)}
          aria-label={overviewOpen ? "Collapse booking activity panel" : "Open booking activity panel"}
          aria-expanded={overviewOpen}
          aria-controls={panelId}
          className="relative shadow-[var(--shadow-md)]"
        >
          {overviewOpen ? (
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
          "fixed top-0 bottom-2 right-2 h-auto w-96 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-lg)] z-20 transition-transform duration-300 ease-in-out",
          overviewOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex h-14 w-full items-center justify-center border-b border-[color:var(--border)] px-4">
            <h2 className="text-center text-xl font-bold leading-none">Activity</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 rounded-lg border border-[color:var(--border)] bg-muted/20 p-1">
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setOverviewTab("all")}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    overviewTab === "all"
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewTab("ongoing")}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    overviewTab === "ongoing"
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ongoing ({ongoingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewTab("requests")}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    overviewTab === "requests"
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Requests ({bookingRequests.length})
                </button>
              </div>
            </div>

            {!hasAny ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">
                  {socketConnected === false ? "Disconnected" : "No pending requests"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {overviewTab === "all" || overviewTab === "ongoing" ? (
                  hasOngoing ? (
                    <OngoingBookingsSection
                      ongoingList={ongoingList}
                      etaDurations={durations}
                      onReassign={(booking) => setSelectedBooking(booking)}
                    />
                  ) : overviewTab === "ongoing" ? (
                    <div className="rounded-md border border-[color:var(--border)] bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                      No ongoing bookings right now.
                    </div>
                  ) : null
                ) : null}

                {overviewTab === "all" || overviewTab === "requests" ? (
                  hasRequests ? (
                    <MemoizedBookingRequestsSection
                      bookingRequests={bookingRequests}
                      bookingDecisions={bookingDecisions}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ) : overviewTab === "requests" ? (
                    <div className="rounded-md border border-[color:var(--border)] bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                      No pending requests right now.
                    </div>
                  ) : null
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {overviewOpen && bookingRequests.length > 0 ? (
        <div
          className="fixed inset-0 z-10 transition-opacity duration-300"
          onClick={() => setOverviewOpen(false)}
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

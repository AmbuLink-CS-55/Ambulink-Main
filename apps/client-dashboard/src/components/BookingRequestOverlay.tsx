import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X, Check, XCircle, Truck, Phone, User2 } from "lucide-react";
import { useSocketStore } from "@/hooks/use-socket-store";
import { cn } from "@/lib/utils";

export function BookingRequestOverlay() {
  const bookingRequests = useSocketStore((state) => state.bookingRequests);
  const ongoingBookings = useSocketStore((state) => state.ongoingBookings);
  const removeBookingRequest = useSocketStore((state) => state.removeBookingRequest);
  const bookingDecisions = useSocketStore((state) => state.bookingDecisions);
  const setBookingDecisionPending = useSocketStore((state) => state.setBookingDecisionPending);
  const clearBookingDecision = useSocketStore((state) => state.clearBookingDecision);
  const [isOpen, setIsOpen] = useState(true);

  const ongoingList = Object.values(ongoingBookings);

  const handleAccept = (requestId: string, callback: (response: { approved: boolean }) => void) => {
    callback({ approved: true });
    setBookingDecisionPending(requestId);
  };

  const handleReject = (requestId: string, callback: (response: { approved: boolean }) => void) => {
    callback({ approved: false });
    removeBookingRequest(requestId);
    clearBookingDecision(requestId);
  };

  useEffect(() => {
    const timeouts = Object.entries(bookingDecisions)
      .filter(([, decision]) => ["won", "lost"].includes(decision.status))
      .map(([requestId]) =>
        setTimeout(() => {
          removeBookingRequest(requestId);
          clearBookingDecision(requestId);
        }, 5000)
      );

    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [bookingDecisions, clearBookingDecision, removeBookingRequest]);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed top-2 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative shadow-lg"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Truck />}
          {bookingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
              {bookingRequests.length}
            </span>
          )}
        </Button>
      </div>

      {/* Overlay Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="items-center w-full justify-between p-2 border-b">
            <h1 className="font-bold text-xl items-center text-center ">Activity</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {bookingRequests.length === 0 && ongoingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ongoingList.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Ongoing Bookings
                    </div>
                    {ongoingList.map((booking) => (
                      <Alert key={booking.bookingId} variant="default" className="border-emerald-200">
                        <Truck className="h-4 w-4" />
                        <AlertTitle>Active Booking</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Booking ID: {booking.bookingId}
                          </div>
                          <div className="grid gap-3 text-xs">
                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Patient
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <User2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {booking.patient.fullName ?? "Unknown"}
                                </span>
                              </div>
                              {booking.patient.phoneNumber && (
                                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{booking.patient.phoneNumber}</span>
                                </div>
                              )}
                            </div>

                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Driver / Provider
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {booking.driver.provider?.name ?? "Unknown Provider"}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Driver: {booking.driver.fullName ?? booking.driver.id ?? "Unknown"}
                              </div>
                            </div>

                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Hospital
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {booking.hospital.name ?? "Unknown"}
                              </div>
                              {booking.hospital.phoneNumber && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {booking.hospital.phoneNumber}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Status</span>
                              <span className="font-mono">{booking.status}</span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {bookingRequests.map((request) => (
                  <Alert
                    key={request.requestId}
                    variant="default"
                    className="animate-in slide-in-from-right-5 border-primary/20"
                  >
                    <Bell className="h-4 w-4" />
                    <AlertTitle>New Booking Request</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Request ID: {request.requestId}
                      </div>
                      {request.data && (
                        <div className="grid gap-3 text-xs">
                          <div className="rounded-md border bg-muted/40 p-3">
                            <div className="text-[10px] uppercase text-muted-foreground">
                              Patient
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <User2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {request.data.patient.fullName ?? "Unknown"}
                              </span>
                            </div>
                            {request.data.patient.phoneNumber && (
                              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{request.data.patient.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                          <div className="rounded-md border bg-muted/40 p-3">
                            <div className="text-[10px] uppercase text-muted-foreground">
                              Driver / Provider
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {request.data.driver.ambulance_provider?.name ?? "Unknown Provider"}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Driver ID: {request.data.driver.id}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Request ID</span>
                            <span className="font-mono">{request.requestId}</span>
                          </div>
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status === "pending" && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Waiting for decision...
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status === "won" && (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          You got the booking.
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status === "lost" && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Another dispatcher got it: {bookingDecisions[request.requestId].winner.name ?? "Unknown"}
                          {bookingDecisions[request.requestId].winner.providerName
                            ? ` (${bookingDecisions[request.requestId].winner.providerName})`
                            : ""}
                          .
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status !== "won" &&
                        bookingDecisions[request.requestId]?.status !== "lost" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(request.requestId, request.callback)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={bookingDecisions[request.requestId]?.status === "pending"}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.requestId, request.callback)}
                              className="flex-1"
                              disabled={bookingDecisions[request.requestId]?.status === "pending"}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && bookingRequests.length > 0 && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

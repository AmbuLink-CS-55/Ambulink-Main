import { memo, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Phone, User2, XCircle } from "lucide-react";
import type { BookingDecisionState, BookingRequestEntity } from "@/lib/booking-types";

const REQUEST_EXPIRY_MS = 30000;

function getTimeLeft(now: number, timestamp: number) {
  return Math.max(0, REQUEST_EXPIRY_MS - (now - timestamp));
}

function getProgressClasses(remainingMs: number) {
  const ratio = remainingMs / REQUEST_EXPIRY_MS;
  if (ratio <= 0.33) return "bg-[color:var(--destructive)]";
  if (ratio <= 0.66) return "bg-[color:var(--secondary)]";
  return "bg-[color:var(--primary)]";
}

export function BookingRequestsSection({
  bookingRequests,
  bookingDecisions,
  onAccept,
  onReject,
}: {
  bookingRequests: BookingRequestEntity[];
  bookingDecisions: Record<string, BookingDecisionState>;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (bookingRequests.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [bookingRequests.length]);

  return (
    <>
      {bookingRequests.map((request) => {
        const decision = bookingDecisions[request.requestId];
        const remainingMs = getTimeLeft(now, request.timestamp);
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const progressWidth = `${Math.max(0, (remainingMs / REQUEST_EXPIRY_MS) * 100)}%`;

        return (
          <Alert
            key={request.requestId}
            variant="default"
            className="animate-in slide-in-from-right-5 border-[color:var(--border)] bg-[color:var(--card)]"
          >
            <Bell className="h-4 w-4" />
            <AlertTitle>New Booking Request</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="text-xs text-muted-foreground">Request ID: {request.requestId}</div>

              <div className="grid gap-3 text-xs">
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Patient</div>
                  <div className="mt-1 flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {request.data.patient.fullName ?? "Unknown"}
                    </span>
                  </div>
                  {request.data.patient.phoneNumber ? (
                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{request.data.patient.phoneNumber}</span>
                    </div>
                  ) : null}
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

              <Badge variant="warning">Pending Dispatcher Decision</Badge>

              {decision?.status === "pending" ? (
                <div className="mt-3 rounded-md border border-[color:var(--secondary)]/40 bg-[color:var(--secondary)]/10 px-3 py-2 text-xs text-[color:var(--foreground)]">
                  Waiting for decision...
                </div>
              ) : null}

              {decision?.status !== "pending" && decision?.status !== "won" ? (
                <div
                  className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs"
                  // Countdown updates are polite to avoid interrupting critical screen-reader announcements.
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Time remaining</span>
                    <span className="font-mono">{remainingSeconds}s</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--border)]/40">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressClasses(remainingMs)}`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              ) : null}

              {decision?.status === "won" ? (
                <div className="mt-3 rounded-md border border-[color:var(--primary)]/40 bg-[color:var(--primary)]/10 px-3 py-2 text-xs text-[color:var(--foreground)]">
                  You got the booking.
                </div>
              ) : null}

              {decision?.status === "lost" ? (
                <div className="mt-3 rounded-md border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 px-3 py-2 text-xs text-[color:var(--foreground)]">
                  Another dispatcher got it: {decision.winner.name ?? "Unknown"}
                  {decision.winner.providerName ? ` (${decision.winner.providerName})` : ""}.
                </div>
              ) : null}

              {decision?.status !== "won" && decision?.status !== "lost" ? (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAccept(request.requestId)}
                    className="flex-1"
                    disabled={decision?.status === "pending"}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(request.requestId)}
                    className="flex-1"
                    disabled={decision?.status === "pending"}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        );
      })}
    </>
  );
}

export const MemoizedBookingRequestsSection = memo(BookingRequestsSection);

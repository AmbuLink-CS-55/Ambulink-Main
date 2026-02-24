import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, Check, Phone, User2, XCircle } from "lucide-react";
import type { BookingDecisionState, BookingRequestEntity } from "@/lib/booking-types";

const REQUEST_EXPIRY_MS = 30000;

export function BookingRequestsSection({
  bookingRequests,
  bookingDecisions,
  now,
  onAccept,
  onReject,
}: {
  bookingRequests: BookingRequestEntity[];
  bookingDecisions: Record<string, BookingDecisionState>;
  now: number;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}) {
  return bookingRequests.map((request) => {
    const decision = bookingDecisions[request.requestId];

    return (
      <Alert
        key={request.requestId}
        variant="default"
        className="animate-in slide-in-from-right-5 border-primary/20"
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
                <span className="font-medium">{request.data.patient.fullName ?? "Unknown"}</span>
              </div>
              {request.data.patient.phoneNumber && (
                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{request.data.patient.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Driver / Provider</div>
              <div className="mt-1 text-sm font-medium">
                {request.data.driver.ambulance_provider?.name ?? "Unknown Provider"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Driver ID: {request.data.driver.id}</div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Request ID</span>
              <span className="font-mono">{request.requestId}</span>
            </div>
          </div>

          {decision?.status === "pending" && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Waiting for decision...
            </div>
          )}

          {decision?.status !== "pending" && decision?.status !== "won" && (
            <div className="mt-3 rounded-md border border-muted/60 bg-muted/30 px-3 py-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Time remaining</span>
                <span className="font-mono">
                  {Math.max(0, Math.ceil((REQUEST_EXPIRY_MS - (now - request.timestamp)) / 1000))}s
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.max(0, ((REQUEST_EXPIRY_MS - (now - request.timestamp)) / REQUEST_EXPIRY_MS) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {decision?.status === "won" && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              You got the booking.
            </div>
          )}

          {decision?.status === "lost" && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              Another dispatcher got it: {decision.winner.name ?? "Unknown"}
              {decision.winner.providerName ? ` (${decision.winner.providerName})` : ""}.
            </div>
          )}

          {decision?.status !== "won" && decision?.status !== "lost" && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onAccept(request.requestId)}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
          )}
        </AlertDescription>
      </Alert>
    );
  });
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User2 } from "lucide-react";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

function formatEta(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 1) return "<1 min";
  return `${minutes} min`;
}

function statusVariant(status: DispatcherBookingPayload["status"]): BadgeVariant {
  if (status === "ASSIGNED") return "assigned";
  if (status === "ARRIVED") return "arrived";
  if (status === "COMPLETED") return "completed";
  return "info";
}

export function OngoingBookingsSection({
  ongoingList,
  etaDurations,
  onReassign,
}: {
  ongoingList: DispatcherBookingPayload[];
  etaDurations: Record<string, number>;
  onReassign: (booking: DispatcherBookingPayload) => void;
}) {
  if (ongoingList.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Ongoing Bookings</div>
      {ongoingList.map((booking) => {
        const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
        const routeKey = `${booking.bookingId}:${phase}`;
        const eta = formatEta(etaDurations[routeKey]);
        const badgeVariant = statusVariant(booking.status);

        return (
          <Alert
            key={booking.bookingId}
            variant="default"
            className="border-[color:var(--border)] bg-[color:var(--card)]"
          >
            <img src="/ambulance.svg" alt="" aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Active Booking</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="text-xs text-muted-foreground">Booking ID: {booking.bookingId}</div>
              <div className="grid gap-3 text-xs">
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Patient</div>
                  <div className="mt-1 flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.patient.fullName ?? "Unknown"}</span>
                  </div>
                  {booking.patient.phoneNumber ? (
                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{booking.patient.phoneNumber}</span>
                    </div>
                  ) : null}
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
                  <div className="text-[10px] uppercase text-muted-foreground">Hospital</div>
                  <div className="mt-1 text-sm font-medium">
                    {booking.hospital.name ?? "Unknown"}
                  </div>
                  {booking.hospital.phoneNumber ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {booking.hospital.phoneNumber}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Status</span>
                  <Badge variant={badgeVariant}>{booking.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>ETA</span>
                  <span className="font-semibold text-foreground">{eta ?? "Calculating..."}</span>
                </div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReassign(booking)}
                    className="w-full"
                  >
                    Reassign Booking
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

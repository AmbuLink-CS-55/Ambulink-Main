import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Phone, Truck, User2 } from "lucide-react";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

export function OngoingBookingsSection({
  ongoingList,
  onReassign,
}: {
  ongoingList: DispatcherBookingPayload[];
  onReassign: (booking: DispatcherBookingPayload) => void;
}) {
  if (ongoingList.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Ongoing Bookings</div>
      {ongoingList.map((booking) => (
        <Alert key={booking.bookingId} variant="default" className="border-emerald-200">
          <Truck className="h-4 w-4" />
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
                {booking.patient.phoneNumber && (
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{booking.patient.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="rounded-md border bg-muted/40 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Driver / Provider</div>
                <div className="mt-1 text-sm font-medium">
                  {booking.driver.provider?.name ?? "Unknown Provider"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Driver: {booking.driver.fullName ?? booking.driver.id ?? "Unknown"}
                </div>
              </div>

              <div className="rounded-md border bg-muted/40 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Hospital</div>
                <div className="mt-1 text-sm font-medium">{booking.hospital.name ?? "Unknown"}</div>
                {booking.hospital.phoneNumber && (
                  <div className="mt-1 text-xs text-muted-foreground">{booking.hospital.phoneNumber}</div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Status</span>
                <span className="font-mono">{booking.status}</span>
              </div>
              <div className="pt-1">
                <Button size="sm" variant="outline" onClick={() => onReassign(booking)} className="w-full">
                  Reassign Booking
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

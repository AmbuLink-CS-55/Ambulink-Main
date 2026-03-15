import { useId, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LocationMiniMap } from "@/components/booking/LocationMiniMap";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import { useGetDrivers } from "@/services/driver.service";
import { useGetHospitals } from "@/services/hospital.service";
import { useReassignBooking } from "@/services/booking.service";

export function ReassignBookingDialog({
  booking,
  open,
  onClose,
}: {
  booking: DispatcherBookingPayload | null;
  open: boolean;
  onClose: () => void;
}) {
  const bookingLocation = booking ? (booking.pickupLocation ?? booking.patient.location) : null;
  const dialogKey = `${booking?.bookingId ?? "empty"}-${open ? "open" : "closed"}`;

  const [reassignDriverId, setReassignDriverId] = useState(() => booking?.driver.id ?? "");
  const [reassignHospitalId, setReassignHospitalId] = useState(() => booking?.hospital.id ?? "");
  const [reassignPickupX, setReassignPickupX] = useState(
    () => bookingLocation?.x?.toString() ?? ""
  );
  const [reassignPickupY, setReassignPickupY] = useState(
    () => bookingLocation?.y?.toString() ?? ""
  );
  const [reassignPickupAddress, setReassignPickupAddress] = useState("");
  const [reassignError, setReassignError] = useState<string | null>(null);
  const driverId = useId();
  const hospitalId = useId();
  const pickupXId = useId();
  const pickupYId = useId();
  const pickupAddressId = useId();

  const drivers = useGetDrivers({ isActive: true });
  const hospitals = useGetHospitals();
  const reassignBooking = useReassignBooking();

  const driverOptions = useMemo(
    () =>
      [...(drivers.data ?? [])]
        .sort((a, b) => {
          const aRank = a.status === "AVAILABLE" ? 0 : 1;
          const bRank = b.status === "AVAILABLE" ? 0 : 1;
          if (aRank !== bRank) return aRank - bRank;
          return (a.fullName ?? "").localeCompare(b.fullName ?? "");
        })
        .map((driver) => ({
          value: driver.id,
          label: `${driver.fullName ?? "Unknown"} (${driver.status ?? "N/A"})`,
        })),
    [drivers.data]
  );

  const hospitalOptions = useMemo(
    () =>
      (hospitals.data ?? []).map((hospital) => ({
        value: hospital.id,
        label: hospital.name,
      })),
    [hospitals.data]
  );

  const currentReassignPoint = useMemo(() => {
    const x = Number.parseFloat(reassignPickupX);
    const y = Number.parseFloat(reassignPickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }, [reassignPickupX, reassignPickupY]);

  const handleReassign = async () => {
    if (!booking) return;

    setReassignError(null);

    const payload: {
      driverId?: string;
      hospitalId?: string;
      pickupLocation?: { x: number; y: number };
      pickupAddress?: string | null;
    } = {};

    if (reassignDriverId && reassignDriverId !== booking.driver.id) {
      payload.driverId = reassignDriverId;
    }

    if (reassignHospitalId && reassignHospitalId !== booking.hospital.id) {
      payload.hospitalId = reassignHospitalId;
    }

    const currentPickup = booking.pickupLocation ?? booking.patient.location;
    const x = Number.parseFloat(reassignPickupX);
    const y = Number.parseFloat(reassignPickupY);
    const pickupChanged =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      (x !== currentPickup?.x || y !== currentPickup?.y);

    if (pickupChanged) {
      payload.pickupLocation = { x, y };
    }

    if (reassignPickupAddress.trim()) {
      payload.pickupAddress = reassignPickupAddress.trim();
    }

    if (Object.keys(payload).length === 0) {
      setReassignError("No changes detected. Update at least one field.");
      return;
    }

    try {
      await reassignBooking.mutateAsync({ bookingId: booking.bookingId, payload });
      onClose();
    } catch (error) {
      setReassignError(getBookingActionErrorMessage(error));
    }
  };

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>Reassign Booking</DialogTitle>
          <DialogDescription>
            Change driver, hospital, or pickup location for this active booking.
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 gap-4 overflow-y-auto px-6 pb-6 min-h-0">
          {reassignError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not reassign booking</AlertTitle>
              <AlertDescription>{reassignError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={driverId}>
              Driver
            </label>
            <Select
              id={driverId}
              name="driverId"
              value={reassignDriverId}
              onChange={(e) => setReassignDriverId(e.target.value)}
              options={driverOptions}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={hospitalId}>
              Hospital
            </label>
            <Select
              id={hospitalId}
              name="hospitalId"
              value={reassignHospitalId}
              onChange={(e) => setReassignHospitalId(e.target.value)}
              options={hospitalOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={pickupXId}>
                Pickup Longitude (x)
              </label>
              <Input
                id={pickupXId}
                name="pickupX"
                value={reassignPickupX}
                onChange={(e) => setReassignPickupX(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={pickupYId}>
                Pickup Latitude (y)
              </label>
              <Input
                id={pickupYId}
                name="pickupY"
                value={reassignPickupY}
                onChange={(e) => setReassignPickupY(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Pick Location on Map</p>
            <LocationMiniMap
              className="h-40 sm:h-52 w-full overflow-hidden rounded-md border"
              value={currentReassignPoint}
              onChange={(point) => {
                setReassignPickupX(point.x.toFixed(6));
                setReassignPickupY(point.y.toFixed(6));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Click map or drag marker to update pickup location.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={pickupAddressId}>
              Pickup Address (optional)
            </label>
            <Input
              id={pickupAddressId}
              name="pickupAddress"
              autoComplete="street-address"
              value={reassignPickupAddress}
              onChange={(e) => setReassignPickupAddress(e.target.value)}
              placeholder="Only send if changed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={reassignBooking.isPending}>
            {reassignBooking.isPending ? "Saving..." : "Apply Reassignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

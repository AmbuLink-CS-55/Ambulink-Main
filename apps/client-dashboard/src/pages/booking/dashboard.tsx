import { useMemo, useState } from "react";
import {
  type BookingLogEntry,
  useGetBookingLog,
  useManualAssignBooking,
} from "@/services/booking.service";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetDrivers } from "@/services/driver.service";
import { useGetHospitals } from "@/services/hospital.service";
import { useGetPatients } from "@/services/patient.service";
import { LocationMiniMap } from "@/components/booking/LocationMiniMap";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import { useMapView } from "@/hooks/use-map-view";
import env from "@/../env";

type Status = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";

function statusVariant(status: Status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "destructive";
  if (status === "REQUESTED") return "outline";
  return "secondary";
}

export default function BookingLogPage() {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [patientMode, setPatientMode] = useState<"existing" | "guest">("guest");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [pickupX, setPickupX] = useState("");
  const [pickupY, setPickupY] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [emergencyType, setEmergencyType] = useState("");

  const bookingLog = useGetBookingLog({ providerId: env.VITE_PROVIDER_ID });
  const { mapView } = useMapView();
  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID, isActive: true });
  const hospitals = useGetHospitals();
  const patients = useGetPatients({ isActive: true });
  const manualAssignBooking = useManualAssignBooking();

  const rows = useMemo(() => bookingLog.data ?? [], [bookingLog.data]);

  const recentPatients = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; phone: string }>();
    rows.forEach((row) => {
      if (!row.patientId) return;
      if (!row.patientName) return;
      if (unique.has(row.patientId)) return;
      unique.set(row.patientId, {
        id: row.patientId,
        name: row.patientName,
        phone: row.patientPhone ?? "",
      });
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [rows]);

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
  const patientOptions = useMemo(
    () =>
      (patients.data ?? []).map((patient) => ({
        value: patient.id,
        label: `${patient.fullName ?? "Unknown"} ${patient.phoneNumber ? `(${patient.phoneNumber})` : ""}`,
      })),
    [patients.data]
  );

  const columns = useMemo(
    () => [
      {
        header: "Booking",
        width: "180px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.bookingId}</div>
            <div className="text-xs text-muted-foreground">Provider: {row.providerName ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Patient",
        width: "200px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.patientName ?? "Unknown"}</div>
            <div className="text-xs text-muted-foreground">{row.patientPhone ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Driver",
        width: "200px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.driverName ?? row.driverId ?? "-"}</div>
            <div className="text-xs text-muted-foreground">{row.driverPhone ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Ambulance",
        width: "160px",
        cell: (row: BookingLogEntry) => row.ambulanceId ?? "-",
      },
      {
        header: "Hospital",
        width: "180px",
        cell: (row: BookingLogEntry) => row.hospitalName ?? "-",
      },
      {
        header: "Status",
        width: "140px",
        cell: (row: BookingLogEntry) => (
          <Badge variant={statusVariant(row.status as Status)}>{row.status}</Badge>
        ),
      },
      {
        header: "Requested",
        width: "170px",
        cell: (row: BookingLogEntry) =>
          row.requestedAt ? new Date(row.requestedAt).toLocaleString() : "-",
      },
      {
        header: "Completed",
        width: "170px",
        cell: (row: BookingLogEntry) =>
          row.completedAt ? new Date(row.completedAt).toLocaleString() : "-",
      },
    ],
    []
  );

  const resetManualForm = () => {
    setPatientMode("guest");
    setSelectedPatientId("");
    setGuestPhone("");
    setGuestEmail("");
    setSelectedDriverId("");
    setSelectedHospitalId("");
    setPickupX("");
    setPickupY("");
    setPickupAddress("");
    setEmergencyType("");
    setManualError(null);
  };

  const prefillPickupFromMapOrLocation = () => {
    if (!pickupX || !pickupY) {
      setPickupX(mapView.center[0].toString());
      setPickupY(mapView.center[1].toString());
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupX(position.coords.longitude.toString());
        setPickupY(position.coords.latitude.toString());
      },
      () => {
        // Keep map-center fallback if permission denied or unavailable.
      },
      { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
    );
  };

  const handleManualAssign = async () => {
    setManualError(null);

    if (!selectedDriverId || !selectedHospitalId) {
      setManualError("Select both a driver and a hospital.");
      return;
    }

    const x = Number.parseFloat(pickupX);
    const y = Number.parseFloat(pickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setManualError("Pickup location must be valid numeric coordinates.");
      return;
    }

    if (patientMode === "existing" && !selectedPatientId) {
      setManualError("Select an existing patient or switch to Guest mode.");
      return;
    }

    try {
      await manualAssignBooking.mutateAsync({
        dispatcherId: env.VITE_DISPATCHER_ID,
        driverId: selectedDriverId,
        hospitalId: selectedHospitalId,
        pickupLocation: { x, y },
        pickupAddress: pickupAddress.trim() || null,
        emergencyType: emergencyType.trim() || null,
        patientId: patientMode === "existing" ? selectedPatientId : undefined,
        patientPhoneNumber: patientMode === "guest" ? guestPhone.trim() || null : undefined,
        patientEmail: patientMode === "guest" ? guestEmail.trim() || null : undefined,
      });
      resetManualForm();
      setIsManualOpen(false);
    } catch (error) {
      setManualError(getBookingActionErrorMessage(error));
    }
  };

  const currentPickupPoint = (() => {
    const x = Number.parseFloat(pickupX);
    const y = Number.parseFloat(pickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  })();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Booking Log</h1>
          <p className="text-sm text-muted-foreground">All booking history across statuses.</p>
        </div>
        <Button
          onClick={() => {
            setIsManualOpen(true);
            prefillPickupFromMapOrLocation();
          }}
          disabled={!env.VITE_PROVIDER_ID}
        >
          New Manual Booking
        </Button>
      </div>

      <Dialog
        open={isManualOpen}
        onOpenChange={(open) => {
          setIsManualOpen(open);
          if (!open) {
            resetManualForm();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>New Manual Booking</DialogTitle>
            <DialogDescription>
              Create and assign a booking for phone calls or non-app requests.
            </DialogDescription>
          </DialogHeader>

          <div className="grid flex-1 gap-4 overflow-y-auto px-6 pb-6 min-h-0">
            {manualError && (
              <Alert variant="destructive">
                <AlertTitle>Could not assign booking</AlertTitle>
                <AlertDescription>{manualError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Patient Type</label>
              <Select
                value={patientMode}
                onChange={(e) => setPatientMode(e.target.value as "existing" | "guest")}
                options={[
                  { value: "guest", label: "Guest" },
                  { value: "existing", label: "Existing Patient" },
                ]}
              />
            </div>

            {patientMode === "existing" ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Existing Patient</label>
                <Select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  options={patientOptions}
                  placeholder="Select patient"
                />
                {recentPatients.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {recentPatients.map((patient) => (
                      <Button
                        key={patient.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        {patient.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Guest Phone (optional)</label>
                  <Input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. +94..."
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Guest Email (optional)</label>
                  <Input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@email.com"
                  />
                </div>
                {recentPatients.length > 0 && (
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Quick fill from recent callers
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {recentPatients
                        .filter((patient) => !!patient.phone)
                        .map((patient) => (
                          <Button
                            key={`${patient.id}-guest`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGuestPhone(patient.phone);
                              setGuestEmail("");
                            }}
                          >
                            {patient.name} {patient.phone}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">Driver</label>
              <Select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                options={driverOptions}
                placeholder="Select driver"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Hospital</label>
              <Select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                options={hospitalOptions}
                placeholder="Select hospital"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Pickup Longitude (x)</label>
                <Input value={pickupX} onChange={(e) => setPickupX(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Pickup Latitude (y)</label>
                <Input value={pickupY} onChange={(e) => setPickupY(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Pick Location on Map</label>
              <LocationMiniMap
                className="h-40 sm:h-52 w-full overflow-hidden rounded-md border"
                value={currentPickupPoint}
                onChange={(point) => {
                  setPickupX(point.x.toFixed(6));
                  setPickupY(point.y.toFixed(6));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Click map or drag marker to set pickup location.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Pickup Address (optional)</label>
              <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Emergency Type (optional)</label>
              <Input value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualAssign} disabled={manualAssignBooking.isPending}>
              {manualAssignBooking.isPending ? "Assigning..." : "Assign Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VirtualizedTable columns={columns} rows={rows} height={640} rowHeight={56} />
    </div>
  );
}

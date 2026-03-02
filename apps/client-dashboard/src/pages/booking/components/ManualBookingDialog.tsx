import { useId } from "react";
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
import type { ManualBookingFormState } from "@/pages/booking/hooks/use-manual-booking-form";

type Option = { value: string; label: string };

export function ManualBookingDialog({
  open,
  onOpenChange,
  form,
  updateField,
  currentPickupPoint,
  recentPatients,
  options,
  manualError,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ManualBookingFormState;
  updateField: <K extends keyof ManualBookingFormState>(
    field: K,
    value: ManualBookingFormState[K]
  ) => void;
  currentPickupPoint: { x: number; y: number } | null;
  recentPatients: Array<{ id: string; name: string; phone: string }>;
  options: {
    patientOptions: Option[];
    driverOptions: Option[];
    hospitalOptions: Option[];
  };
  manualError: string | null;
  isPending: boolean;
  onSubmit: () => void;
}) {
  const patientModeId = useId();
  const selectedPatientId = useId();
  const guestPhoneId = useId();
  const guestEmailId = useId();
  const selectedDriverId = useId();
  const selectedHospitalId = useId();
  const pickupXId = useId();
  const pickupYId = useId();
  const pickupAddressId = useId();
  const emergencyTypeId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>New Manual Booking</DialogTitle>
          <DialogDescription>
            Create and assign a booking for phone calls or non-app requests.
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 gap-4 overflow-y-auto px-6 pb-6 min-h-0">
          {manualError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not assign booking</AlertTitle>
              <AlertDescription>{manualError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={patientModeId}>
              Patient Type
            </label>
            <Select
              id={patientModeId}
              name="patientMode"
              value={form.patientMode}
              onChange={(e) => updateField("patientMode", e.target.value as "existing" | "guest")}
              options={[
                { value: "guest", label: "Guest" },
                { value: "existing", label: "Existing Patient" },
              ]}
            />
          </div>

          {form.patientMode === "existing" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={selectedPatientId}>
                Existing Patient
              </label>
              <Select
                id={selectedPatientId}
                name="selectedPatientId"
                value={form.selectedPatientId}
                onChange={(e) => updateField("selectedPatientId", e.target.value)}
                options={options.patientOptions}
                placeholder="Select patient"
              />
              {recentPatients.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {recentPatients.map((patient) => (
                    <Button
                      key={patient.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateField("selectedPatientId", patient.id)}
                    >
                      {patient.name}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={guestPhoneId}>
                  Guest Phone (optional)
                </label>
                <Input
                  id={guestPhoneId}
                  name="guestPhone"
                  autoComplete="tel"
                  value={form.guestPhone}
                  onChange={(e) => updateField("guestPhone", e.target.value)}
                  placeholder="e.g. +94..."
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={guestEmailId}>
                  Guest Email (optional)
                </label>
                <Input
                  id={guestEmailId}
                  name="guestEmail"
                  autoComplete="email"
                  type="email"
                  value={form.guestEmail}
                  onChange={(e) => updateField("guestEmail", e.target.value)}
                  placeholder="guest@email.com"
                />
              </div>

              {recentPatients.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Quick fill from recent callers
                  </p>
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
                            updateField("guestPhone", patient.phone);
                            updateField("guestEmail", "");
                          }}
                        >
                          {patient.name} {patient.phone}
                        </Button>
                      ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={selectedDriverId}>
              Driver
            </label>
            <Select
              id={selectedDriverId}
              name="selectedDriverId"
              value={form.selectedDriverId}
              onChange={(e) => updateField("selectedDriverId", e.target.value)}
              options={options.driverOptions}
              placeholder="Select driver"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={selectedHospitalId}>
              Hospital
            </label>
            <Select
              id={selectedHospitalId}
              name="selectedHospitalId"
              value={form.selectedHospitalId}
              onChange={(e) => updateField("selectedHospitalId", e.target.value)}
              options={options.hospitalOptions}
              placeholder="Select hospital"
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
                value={form.pickupX}
                onChange={(e) => updateField("pickupX", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={pickupYId}>
                Pickup Latitude (y)
              </label>
              <Input
                id={pickupYId}
                name="pickupY"
                value={form.pickupY}
                onChange={(e) => updateField("pickupY", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Pick Location on Map</p>
            <LocationMiniMap
              className="h-40 sm:h-52 w-full overflow-hidden rounded-md border"
              value={currentPickupPoint}
              onChange={(point) => {
                updateField("pickupX", point.x.toFixed(6));
                updateField("pickupY", point.y.toFixed(6));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Click map or drag marker to set pickup location.
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
              value={form.pickupAddress}
              onChange={(e) => updateField("pickupAddress", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={emergencyTypeId}>
              Emergency Type (optional)
            </label>
            <Input
              id={emergencyTypeId}
              name="emergencyType"
              value={form.emergencyType}
              onChange={(e) => updateField("emergencyType", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Assigning..." : "Assign Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

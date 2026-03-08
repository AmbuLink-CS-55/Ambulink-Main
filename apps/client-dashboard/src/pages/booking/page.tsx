import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components";
import { useGetBookingLog, useManualAssignBooking } from "@/services/booking.service";
import { useMapView } from "@/hooks/use-map-view";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import { bookingLogColumns } from "@/pages/booking/components/booking-log-columns";
import { BookingDetailDialog } from "@/pages/booking/components/BookingDetailDialog";
import { ManualBookingDialog } from "@/pages/booking/components/ManualBookingDialog";
import { useBookingLogOptions } from "@/pages/booking/hooks/use-booking-log-options";
import { useManualBookingForm } from "@/pages/booking/hooks/use-manual-booking-form";
import { getDispatcherId } from "@/lib/identity";
import env from "@/../env";

export default function BookingLogPage() {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const bookingLog = useGetBookingLog({ providerId: env.VITE_PROVIDER_ID });
  const manualAssignBooking = useManualAssignBooking();
  const { mapView } = useMapView();

  const rows = useMemo(() => bookingLog.data ?? [], [bookingLog.data]);
  const { driverOptions, hospitalOptions, patientOptions, recentPatients } =
    useBookingLogOptions(rows);
  const { form, updateField, resetForm, prefillPickupFromMapOrLocation, currentPickupPoint } =
    useManualBookingForm();

  const handleManualAssign = async () => {
    setManualError(null);

    if (!form.selectedDriverId || !form.selectedHospitalId) {
      setManualError("Select both a driver and a hospital.");
      return;
    }

    const x = Number.parseFloat(form.pickupX);
    const y = Number.parseFloat(form.pickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setManualError("Pickup location must be valid numeric coordinates.");
      return;
    }

    if (form.patientMode === "existing" && !form.selectedPatientId) {
      setManualError("Select an existing patient or switch to Guest mode.");
      return;
    }

    try {
      await manualAssignBooking.mutateAsync({
        dispatcherId: getDispatcherId(),
        driverId: form.selectedDriverId,
        hospitalId: form.selectedHospitalId,
        pickupLocation: { x, y },
        pickupAddress: form.pickupAddress.trim() || null,
        emergencyType: form.emergencyType.trim() || null,
        patientId: form.patientMode === "existing" ? form.selectedPatientId : undefined,
        patientPhoneNumber:
          form.patientMode === "guest" ? form.guestPhone.trim() || null : undefined,
        patientEmail: form.patientMode === "guest" ? form.guestEmail.trim() || null : undefined,
      });
      resetForm();
      setIsManualOpen(false);
    } catch (error) {
      setManualError(getBookingActionErrorMessage(error));
    }
  };

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
            prefillPickupFromMapOrLocation(mapView.center);
          }}
          disabled={!env.VITE_PROVIDER_ID}
        >
          New Manual Booking
        </Button>
      </div>

      <ManualBookingDialog
        open={isManualOpen}
        onOpenChange={(open) => {
          setIsManualOpen(open);
          if (!open) {
            resetForm();
            setManualError(null);
          }
        }}
        form={form}
        updateField={updateField}
        currentPickupPoint={currentPickupPoint}
        recentPatients={recentPatients}
        options={{ patientOptions, driverOptions, hospitalOptions }}
        manualError={manualError}
        isPending={manualAssignBooking.isPending}
        onSubmit={handleManualAssign}
      />

      <BookingDetailDialog
        open={Boolean(selectedBookingId)}
        bookingId={selectedBookingId}
        dispatcherId={getDispatcherId()}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
      />

      <DataTable
        columns={bookingLogColumns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.bookingId}
        onRowClick={(row) => setSelectedBookingId(row.bookingId)}
      />
    </div>
  );
}

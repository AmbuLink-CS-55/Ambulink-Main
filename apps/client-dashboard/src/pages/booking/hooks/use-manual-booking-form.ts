import { useMemo, useState } from "react";

export type ManualBookingFormState = {
  patientMode: "existing" | "guest";
  selectedPatientId: string;
  guestPhone: string;
  guestEmail: string;
  selectedDriverId: string;
  selectedHospitalId: string;
  pickupX: string;
  pickupY: string;
  pickupAddress: string;
  emergencyType: string;
};

const initialState: ManualBookingFormState = {
  patientMode: "guest",
  selectedPatientId: "",
  guestPhone: "",
  guestEmail: "",
  selectedDriverId: "",
  selectedHospitalId: "",
  pickupX: "",
  pickupY: "",
  pickupAddress: "",
  emergencyType: "",
};

export function useManualBookingForm() {
  const [form, setForm] = useState<ManualBookingFormState>(initialState);

  const updateField = <K extends keyof ManualBookingFormState>(
    field: K,
    value: ManualBookingFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(initialState);

  const prefillPickupFromMapOrLocation = (mapCenter: [number, number]) => {
    setForm((prev) => ({
      ...prev,
      pickupX: prev.pickupX || mapCenter[0].toString(),
      pickupY: prev.pickupY || mapCenter[1].toString(),
    }));

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          pickupX: position.coords.longitude.toString(),
          pickupY: position.coords.latitude.toString(),
        }));
      },
      () => {
        // Keep map-center fallback if permission denied or unavailable.
      },
      { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
    );
  };

  const currentPickupPoint = useMemo(() => {
    const x = Number.parseFloat(form.pickupX);
    const y = Number.parseFloat(form.pickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }, [form.pickupX, form.pickupY]);

  return {
    form,
    updateField,
    resetForm,
    prefillPickupFromMapOrLocation,
    currentPickupPoint,
  };
}

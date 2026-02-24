import { useMemo } from "react";
import { useGetDrivers } from "@/services/driver.service";
import { useGetHospitals } from "@/services/hospital.service";
import { useGetPatients } from "@/services/patient.service";
import type { BookingLogEntry } from "@/services/booking.service";
import env from "@/../env";

export function useBookingLogOptions(rows: BookingLogEntry[]) {
  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID, isActive: true });
  const hospitals = useGetHospitals();
  const patients = useGetPatients({ isActive: true });

  const recentPatients = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; phone: string }>();
    rows.forEach((row) => {
      if (!row.patientId || !row.patientName || unique.has(row.patientId)) return;
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

  return {
    driverOptions,
    hospitalOptions,
    patientOptions,
    recentPatients,
  };
}

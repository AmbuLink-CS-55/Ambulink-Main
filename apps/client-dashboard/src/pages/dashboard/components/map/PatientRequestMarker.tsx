import { useMemo } from "react";
import { MapMarker, MarkerContent } from "@/components/ui/map";
import { useBookingRequestById } from "@/pages/dashboard/hooks/use-booking-requests";

type PatientRequestMarkerProps = {
  id: string;
};

export function PatientRequestMarker({ id }: PatientRequestMarkerProps) {
  const request = useBookingRequestById(id);

  const coordinates = useMemo(() => {
    if (!request) return null;

    const { patient, driver } = request.data;

    if (typeof patient.currentLocation?.x === "number") {
      return [patient.currentLocation.x, patient.currentLocation.y] as [number, number];
    }
    if (typeof driver.currentLocation?.x === "number") {
      return [driver.currentLocation.x, driver.currentLocation.y] as [number, number];
    }
    return null;
  }, [request]);

  if (!request || !coordinates) return null;
  if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return null;

  return (
    <MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
      <MarkerContent className="relative flex items-center justify-center h-3 w-3">
        <span className="absolute h-20 w-20 rounded-full border border-yellow-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <span className="absolute h-15 w-15 rounded-full border border-yellow-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.3s]" />
        <span className="absolute h-10 w-10 rounded-full border border-yellow-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.6s]" />

        <span className="relative block h-3 w-3 rounded-full bg-yellow-400 border-2 border-white shadow" />
      </MarkerContent>
    </MapMarker>
  );
}

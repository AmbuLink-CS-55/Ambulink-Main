import { useEffect, useMemo, useRef, useState } from "react";
import { MapMarker, MarkerContent } from "@/components/ui/map";
import type { BookingRequest } from "@/hooks/use-socket-store";

type PatientRequestMarkerProps = {
  request: BookingRequest;
};

export function PatientRequestMarker({ request }: PatientRequestMarkerProps) {
  const [pulse, setPulse] = useState(0);
  const frameRef = useRef<number | null>(null);

  const coordinates = useMemo(() => {
    const patientLocation = request.data.patient.currentLocation;
    if (patientLocation && typeof patientLocation.x === "number") {
      return [patientLocation.x, patientLocation.y] as [number, number];
    }

    const patientLat = request.data.patient.lat;
    const patientLng = request.data.patient.lng;
    if (typeof patientLat === "number" && typeof patientLng === "number") {
      return [patientLng, patientLat] as [number, number];
    }

    return [request.data.driver.lng, request.data.driver.lat] as [number, number];
  }, [request]);

  const hasValidCoordinates = Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) % 2000;
      setPulse(elapsed / 2000);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const ringSize = 28 + pulse * 24;
  const ringOpacity = 0.6 - pulse * 0.6;

  if (!hasValidCoordinates) return null;

  return (
    <MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
      <MarkerContent className="relative">
        <span
          className="absolute rounded-full border border-yellow-400"
          style={{
            width: ringSize,
            height: ringSize,
            opacity: ringOpacity,
            left: -(ringSize / 2 - 6),
            top: -(ringSize / 2 - 6),
          }}
        />
        <span className="relative block h-3 w-3 rounded-full bg-yellow-400 border-4 border-white shadow" />
      </MarkerContent>
    </MapMarker>
  );
}

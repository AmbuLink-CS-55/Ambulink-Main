import { MapMarker, MarkerContent } from "@/components/ui/map";

type DriverMarkerProps = {
  longitude: number;
  latitude: number;
  variant?: "active" | "available";
};

export function DriverMarker({ longitude, latitude, variant = "active" }: DriverMarkerProps) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  const markerClassName =
    variant === "available"
      ? "h-3 w-3 rounded-full border-2 border-red-500 bg-white shadow"
      : "h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow";

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative">
        <span className={`relative block ${markerClassName}`} />
      </MarkerContent>
    </MapMarker>
  );
}

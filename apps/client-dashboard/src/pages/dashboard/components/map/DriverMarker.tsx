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
      ? "h-3 w-3 rounded-full border-2 border-[color:var(--destructive)] bg-[color:var(--card)] shadow-[var(--shadow-sm)]"
      : "h-3 w-3 rounded-full bg-[color:var(--destructive)] border-2 border-[color:var(--card)] shadow-[var(--shadow-sm)]";

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative">
        <span className={`relative block ${markerClassName}`} />
      </MarkerContent>
    </MapMarker>
  );
}

import { MapMarker, MarkerContent } from "@/components/ui/map";

type OngoingPatientMarkerProps = {
  longitude: number;
  latitude: number;
};

export function OngoingPatientMarker({ longitude, latitude }: OngoingPatientMarkerProps) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative">
        <span className="relative block h-3 w-3 rounded-full bg-yellow-400 border-2 border-[color:var(--card)] shadow-[var(--shadow-sm)]" />
      </MarkerContent>
    </MapMarker>
  );
}

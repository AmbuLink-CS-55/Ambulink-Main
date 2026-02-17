import { MapMarker, MarkerContent } from "@/components/ui/map";

type DriverMarkerProps = {
  longitude: number;
  latitude: number;
};

export function DriverMarker({ longitude, latitude }: DriverMarkerProps) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative">
        <span className="relative block h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow" />
      </MarkerContent>
    </MapMarker>
  );
}

import { MapMarker, MarkerContent } from "@/components/ui/map";

type BookingRequestMarkerProps = {
  longitude: number;
  latitude: number;
};

export function BookingRequestMarker({ longitude, latitude }: BookingRequestMarkerProps) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative">
        <span className="relative block h-16 w-16 overflow-visible">
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400/90 bg-yellow-400/25 animate-ping [animation-duration:1.4s]" />
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400/70 bg-yellow-400/15 animate-ping [animation-duration:1.8s] [animation-delay:180ms]" />
          <span className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400/50 bg-yellow-400/10 animate-ping [animation-duration:2.3s] [animation-delay:360ms]" />
          <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--card)] bg-yellow-400 shadow-[var(--shadow-md)]" />
        </span>
      </MarkerContent>
    </MapMarker>
  );
}

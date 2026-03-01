import { useEffect } from "react";
import type { MapMouseEvent } from "maplibre-gl";
import { Map, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import type { Point } from "@/lib/types";

type LocationMiniMapProps = {
  value: Point | null;
  onChange: (point: Point) => void;
  className?: string;
};

function MapClickCapture({ onChange }: { onChange: (point: Point) => void }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = (event: MapMouseEvent) => {
      onChange({
        x: event.lngLat.lng,
        y: event.lngLat.lat,
      });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onChange]);

  return null;
}

function MapViewportSync({ point }: { point: Point | null }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map || !point) return;
    const current = map.getCenter();
    if (Math.abs(current.lng - point.x) < 0.00001 && Math.abs(current.lat - point.y) < 0.00001) {
      return;
    }
    map.flyTo({ center: [point.x, point.y], duration: 300 });
  }, [map, point]);

  return null;
}

export function LocationMiniMap({ value, onChange, className }: LocationMiniMapProps) {
  const fallbackCenter: [number, number] = [79.87, 6.9];
  const center: [number, number] = value ? [value.x, value.y] : fallbackCenter;

  return (
    <div className={className ?? "h-52 w-full overflow-hidden rounded-md border"}>
      <Map theme="light" center={center} zoom={13}>
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          onLocate={(coords) => onChange({ x: coords.longitude, y: coords.latitude })}
        />
        <MapClickCapture onChange={onChange} />
        <MapViewportSync point={value} />
        {value ? (
          <MapMarker
            longitude={value.x}
            latitude={value.y}
            draggable
            onDragEnd={(lngLat) => onChange({ x: lngLat.lng, y: lngLat.lat })}
          >
            <MarkerContent className="relative flex items-center justify-center h-4 w-4">
              <span className="h-3 w-3 rounded-full border-2 border-[color:var(--amb-surface)] bg-[color:var(--amb-critical)] shadow-[var(--amb-shadow-low)]" />
            </MarkerContent>
          </MapMarker>
        ) : null}
      </Map>
    </div>
  );
}

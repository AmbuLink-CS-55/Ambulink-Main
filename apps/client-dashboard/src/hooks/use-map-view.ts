import { useEffect, useState } from "react";

const MAP_VIEW_STORAGE_KEY = "dashboard-map-view";
const DEFAULT_MAP_VIEW = { center: [79.87, 6.9] as [number, number], zoom: 11.5 };

function readPersistedMapView() {
  if (typeof window === "undefined") return DEFAULT_MAP_VIEW;

  try {
    const raw = window.localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    if (!raw) return DEFAULT_MAP_VIEW;

    const parsed = JSON.parse(raw) as {
      center?: [number, number];
      zoom?: number;
    };

    if (
      !parsed.center ||
      parsed.center.length !== 2 ||
      !Number.isFinite(parsed.center[0]) ||
      !Number.isFinite(parsed.center[1]) ||
      !Number.isFinite(parsed.zoom)
    ) {
      return DEFAULT_MAP_VIEW;
    }

    return {
      center: parsed.center,
      zoom: parsed.zoom,
    };
  } catch {
    return DEFAULT_MAP_VIEW;
  }
}

export function useMapView() {
  const [mapView, setMapView] = useState(readPersistedMapView);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(mapView));
  }, [mapView]);

  return { mapView, setMapView };
}

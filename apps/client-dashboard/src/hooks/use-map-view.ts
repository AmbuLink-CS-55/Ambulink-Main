import { useState } from "react";

export function useMapView() {
  const [mapView, setMapView] = useState({ center: [79.87, 6.9] as [number, number], zoom: 11.5 });
  return { mapView, setMapView };
}

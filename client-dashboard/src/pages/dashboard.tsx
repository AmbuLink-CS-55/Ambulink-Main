import { Map, MapControls, MapEvents } from "@/components/ui/map";
import { useStore } from "@/hooks/use-store";


export default function DashBoard() {
  const mapView = useStore((state) => state.mapView)
  const setMapView = useStore((state) => state.setMapView)

  // Note: The dispatcher socket doesn't receive driver:update events
  // Driver location updates would need to be forwarded to dispatchers if needed
  // or dispatchers would need to connect to a separate driver tracking service

  return (
    <>
      <Map
        theme="light"
        center={mapView.center}
        zoom={mapView.zoom}
      >
        <MapEvents onChange={setMapView} />
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          className="mb-4"
        />
      </ Map>
    </>
  );
}

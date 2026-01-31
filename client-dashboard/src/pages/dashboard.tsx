import { Map, MapControls, MapEvents } from "@/components/ui/map";
import { useStore } from "@/hooks/use-store";


export default function DashBoard() {
  const mapView = useStore((state) => state.mapView)
  const setMapView = useStore((state) => state.setMapView)

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

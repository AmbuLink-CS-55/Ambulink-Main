import { useGetHospitals } from "@/services/hospital.service";
import { Map, MapControls, MapEvents } from "@/components/ui/map";
import HospitalMarkersLayer from "@/components/map/HospitalMarkerLayer";
import { useStore } from "@/hooks/use-store";

export default function Dashboard() {
  const mapView = useStore((state) => state.mapView);
  const setMapView = useStore((state) => state.setMapView);
  const { error, data: hospitals } = useGetHospitals();

  if (error) {
    console.error("Error fetching hospitals");
  }

  return (
    <Map theme="dark" center={mapView.center} zoom={mapView.zoom}>
      <MapEvents onChange={setMapView} />
      <MapControls position="bottom-right" showZoom showLocate className="mb-4" />
      {hospitals && <HospitalMarkersLayer hospitals={hospitals} />}
    </Map>
  );
}

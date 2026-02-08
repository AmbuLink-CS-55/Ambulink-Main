import HospitalMarkersLayer from "@/components/map/HospitalMarkerLayer";
import { Map, MapControls, MapEvents } from "@/components/ui/map";
import { useStore } from "@/hooks/use-store";
import { useGetHospitals } from "@/services/hospital.service";

export default function DashBoard() {
  const mapView = useStore((state) => state.mapView);
  const setMapView = useStore((state) => state.setMapView);
  const { error, data: hospitals } = useGetHospitals();

  if (error) throw Error("Error fetching hospitals")

  return (
    <>
      <Map theme="dark" center={mapView.center} zoom={mapView.zoom}>
        <MapEvents onChange={setMapView} />
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          className="mb-4"
        />
        {hospitals && <HospitalMarkersLayer hospitals={hospitals} />}
      </Map>
    </>
  );
}

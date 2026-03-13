import { useEffect } from "react";
import { useGetHospitals } from "@/services/hospital.service";
import { Map as MapView, MapControls } from "@/components/ui/map";
import HospitalMarkersLayer from "@/pages/dashboard/components/map/HospitalMarkerLayer";
import { useMapView } from "@/hooks/use-map-view";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { resolveMapTheme } from "@/lib/theme-mode";

export default function Dashboard() {
  const { mapView } = useMapView();
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const mapTheme = resolveMapTheme(themeMode);
  const { error, data: hospitals } = useGetHospitals();

  useEffect(() => {
    if (error) {
      console.error("Error fetching hospitals", error);
    }
  }, [error]);

  return (
    <MapView theme={mapTheme} center={mapView.center} zoom={mapView.zoom}>
      <MapControls position="bottom-right" showZoom showLocate className="mb-4" />

      {hospitals ? <HospitalMarkersLayer hospitals={hospitals} /> : null}
    </MapView>
  );
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetHospitals } from "@/services/hospital.service";
import { Map as MapView, MapControls } from "@/components/ui/map";
import HospitalMarkersLayer from "@/pages/dashboard/components/map/HospitalMarkerLayer";
import { DriverMarkers } from "@/pages/dashboard/components/map/DriverMarkers";
import { useMapView } from "@/hooks/use-map-view";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { resolveMapTheme } from "@/lib/theme-mode";
import { queryKeys } from "@/lib/queryKeys";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

export default function Dashboard() {
  const { mapView } = useMapView();
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const mapTheme = resolveMapTheme(themeMode);
  const { error, data: hospitals } = useGetHospitals();
  const ongoingBookingsQuery = useQuery<Record<string, DispatcherBookingPayload>>({
    queryKey: queryKeys.ongoingBookings(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const ongoingBookings = ongoingBookingsQuery.data ?? {};

  useEffect(() => {
    if (error) {
      console.error("Error fetching hospitals", error);
    }
  }, [error]);

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MapView theme={mapTheme} center={mapView.center} zoom={mapView.zoom}>
        <MapControls position="bottom-right" showZoom showLocate className="mb-4" />

        {hospitals ? <HospitalMarkersLayer hospitals={hospitals} /> : null}
        <DriverMarkers ongoingBookings={ongoingBookings} />
      </MapView>
    </div>
  );
}

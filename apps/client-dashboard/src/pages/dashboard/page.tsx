import { useEffect } from "react";
import { useGetHospitals } from "@/services/hospital.service";
import { Map as MapView, MapControls } from "@/components/ui/map";
import HospitalMarkersLayer from "@/pages/dashboard/components/map/HospitalMarkerLayer";
import { PatientRequestMarker } from "@/pages/dashboard/components/map/PatientRequestMarker";
import { DriverMarkers } from "@/pages/dashboard/components/map/DriverMarkers";
import { BookingRoutesLayer } from "@/pages/dashboard/components/map/BookingRoutesLayer";
import { useBookingRequests } from "@/pages/dashboard/hooks/use-booking-requests";
import { useMapView } from "@/hooks/use-map-view";
import { useOngoingBookingRoutes } from "@/pages/dashboard/hooks/use-ongoing-booking-routes";
import { useQuery } from "@tanstack/react-query";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { queryKeys } from "@/lib/queryKeys";

export default function Dashboard() {
  const { mapView } = useMapView();
  const { error, data: hospitals } = useGetHospitals();
  const { bookingRequestIds } = useBookingRequests();
  const ongoingBookingsQuery = useQuery<Record<string, DispatcherBookingPayload>>({
    queryKey: queryKeys.ongoingBookings(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const ongoingBookings = ongoingBookingsQuery.data ?? {};
  const { routes, ongoingList } = useOngoingBookingRoutes(ongoingBookings);

  useEffect(() => {
    if (error) {
      console.error("Error fetching hospitals", error);
    }
  }, [error]);

  return (
    <MapView theme="dark" center={mapView.center} zoom={mapView.zoom}>
      <MapControls position="bottom-right" showZoom showLocate className="mb-4" />

      {hospitals ? <HospitalMarkersLayer hospitals={hospitals} /> : null}

      {bookingRequestIds.map((id) => (
        <PatientRequestMarker key={id} id={id} />
      ))}

      <DriverMarkers ongoingBookings={ongoingBookings} />
      <BookingRoutesLayer ongoingList={ongoingList} routes={routes} />
    </MapView>
  );
}

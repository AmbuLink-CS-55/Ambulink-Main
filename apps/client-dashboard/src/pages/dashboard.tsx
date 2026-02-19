import { Fragment, useEffect, useMemo, useState } from "react";
import { useGetHospitals } from "@/services/hospital.service";
import { Map as MapView, MapControls, MapEvents, MapRoute } from "@/components/ui/map";
import HospitalMarkersLayer from "@/components/map/HospitalMarkerLayer";
import { PatientRequestMarker } from "@/components/map/PatientRequestMarker";
import { DriverMarkers } from "@/components/map/DriverMarkers";
import { useMapView } from "@/hooks/use-map-view";
import { useQuery } from "@tanstack/react-query";
import type { BookingNewPayload, DispatcherBookingPayload } from "@/lib/socket-types";
import { queryKeys } from "@/lib/queryKeys";

const routeCache = new globalThis.Map<
  string,
  { coordinates: [number, number][]; updatedAt: number }
>();
const ROUTE_TTL = 1000 * 30;

async function fetchRoute(start: [number, number], end: [number, number]) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch route");
  }
  const data = await response.json();
  return data.routes?.[0]?.geometry?.coordinates as [number, number][];
}

export default function Dashboard() {
  const { mapView, setMapView } = useMapView();
  const { error, data: hospitals } = useGetHospitals();
  const bookingRequestsQuery = useQuery<
    Array<{ requestId: string; data: BookingNewPayload; callback: any; timestamp: number }>
  >({
    queryKey: queryKeys.bookingRequests(),
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
    enabled: false,
  });
  const ongoingBookingsQuery = useQuery<Record<string, DispatcherBookingPayload>>({
    queryKey: queryKeys.ongoingBookings(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const bookingRequests = bookingRequestsQuery.data ?? [];
  const ongoingBookings = ongoingBookingsQuery.data ?? {};
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  // convert to array
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching hospitals", error);
    }
  }, [error]);

  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      const nextRoutes: Record<string, [number, number][]> = {};

      for (const booking of ongoingList) {
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        if (!booking.driver.location || !patientLocation) continue;
        if (
          !Number.isFinite(booking.driver.location.x) ||
          !Number.isFinite(booking.driver.location.y)
        ) {
          continue;
        }
        if (!Number.isFinite(patientLocation.x) || !Number.isFinite(patientLocation.y)) {
          continue;
        }

        const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
        const target = phase === "hospital" ? booking.hospital.location : patientLocation;
        if (!target) continue;
        if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) continue;

        const start: [number, number] = [booking.driver.location.x, booking.driver.location.y];
        const end: [number, number] = [target.x, target.y];
        const routeKey = `${booking.bookingId}:${phase}`;
        const cached = routeCache.get(routeKey);
        if (cached && Date.now() - cached.updatedAt < ROUTE_TTL) {
          nextRoutes[routeKey] = cached.coordinates;
          continue;
        }

        try {
          const coordinates = await fetchRoute(start, end);
          console.log("route got:", routes[routeKey]);

          if (coordinates && coordinates.length >= 2) {
            routeCache.set(routeKey, { coordinates, updatedAt: Date.now() });
            nextRoutes[routeKey] = coordinates;
          }
        } catch (routeError) {
          console.error("Route fetch failed", routeError);
        }
      }

      if (isMounted) {
        setRoutes((prev: Record<string, [number, number][]>) => ({ ...prev, ...nextRoutes }));
      }
    };

    if (ongoingList.length > 0) {
      loadRoutes();
    }

    return () => {
      isMounted = false;
    };
  }, [ongoingBookings]);

  return (
    <MapView theme="dark" center={mapView.center} zoom={mapView.zoom}>
      {/*<MapEvents onChange={setMapView} />*/}
      <MapControls position="bottom-right" showZoom showLocate className="mb-4" />

      {hospitals && <HospitalMarkersLayer hospitals={hospitals} />}

      {bookingRequests.map((request) => (
        <PatientRequestMarker key={request.requestId} request={request} />
      ))}

      <DriverMarkers ongoingBookings={ongoingBookings} />

      {ongoingList.map((booking) => {
        // For Routes
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        const driverLocation = booking.driver.location;
        const hospitalLocation = booking.hospital.location;
        const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
        const routeKey = `${booking.bookingId}:${phase}`;
        const isCompleted = booking.status === "COMPLETED" || booking.status === "CANCELLED";

        return (
          <Fragment key={booking.bookingId}>
            {!isCompleted &&
              phase === "patient" &&
              driverLocation &&
              patientLocation &&
              routes[routeKey] && (
                <MapRoute
                  id={`route-${booking.bookingId}-patient`}
                  coordinates={routes[routeKey]}
                  color="#f59e0b"
                  width={4}
                  opacity={0.85}
                />
              )}
            {!isCompleted &&
              phase === "hospital" &&
              driverLocation &&
              hospitalLocation &&
              routes[routeKey] && (
                <MapRoute
                  id={`route-${booking.bookingId}-hospital`}
                  coordinates={routes[routeKey]}
                  color="#ef4444"
                  width={4}
                  opacity={0.85}
                />
              )}
          </Fragment>
        );
      })}
    </MapView>
  );
}

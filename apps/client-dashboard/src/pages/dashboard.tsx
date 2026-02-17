import { Fragment, useEffect, useMemo, useState } from "react";
import { useGetHospitals } from "@/services/hospital.service";
import { Map as MapView, MapControls, MapEvents, MapRoute } from "@/components/ui/map";
import HospitalMarkersLayer from "@/components/map/HospitalMarkerLayer";
import { PatientRequestMarker } from "@/components/map/PatientRequestMarker";
import { DriverMarker } from "@/components/map/DriverMarker";
import { OngoingPatientMarker } from "@/components/map/OngoingPatientMarker";
import { useStore } from "@/hooks/use-store";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useGetDrivers } from "@/services/driver.service";

const routeCache = new globalThis.Map<string, { coordinates: [number, number][]; updatedAt: number }>();
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
  const mapView = useStore((state) => state.mapView);
  const setMapView = useStore((state) => state.setMapView);
  const { error, data: hospitals } = useGetHospitals();
  const { data: availableDrivers } = useGetDrivers({
    isActive: true,
    status: "AVAILABLE",
  });
  const bookingRequests = useSocketStore((state) => state.bookingRequests);
  const ongoingBookings = useSocketStore((state) => state.ongoingBookings);
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);
  const availableDriverMarkers = useMemo(() => {
    const activeDriverIds = new Set(
      ongoingList.map((booking) => booking.driver.id).filter(Boolean)
    );
    return (availableDrivers ?? []).filter((driver) => {
      if (!driver.currentLocation) return false;
      if (activeDriverIds.has(driver.id)) return false;
      return (
        Number.isFinite(driver.currentLocation.x) &&
        Number.isFinite(driver.currentLocation.y)
      );
    });
  }, [availableDrivers, ongoingList]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching hospitals", error);
    }
  }, [error]);

  useEffect(() => {
    if (availableDrivers === undefined) return;
    if (!availableDrivers.length) return;
    if (availableDrivers.some((driver) => !driver.currentLocation)) {
      console.warn("Some available drivers missing location", availableDrivers);
    }
  }, [availableDrivers]);

  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      const nextRoutes: Record<string, [number, number][]> = {};

      for (const booking of ongoingList) {
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        if (!booking.driver.location || !patientLocation) continue;
        if (!Number.isFinite(booking.driver.location.x) || !Number.isFinite(booking.driver.location.y)) {
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
      <MapEvents onChange={setMapView} />
      <MapControls position="bottom-right" showZoom showLocate className="mb-4" />
      {hospitals && <HospitalMarkersLayer hospitals={hospitals} />}
      {bookingRequests.map((request) => (
        <PatientRequestMarker key={request.requestId} request={request} />
      ))}
      {availableDriverMarkers.map((driver) => (
        <DriverMarker
          key={`available-${driver.id}`}
          longitude={driver.currentLocation!.x}
          latitude={driver.currentLocation!.y}
        />
      ))}
      {ongoingList.map((booking) => {
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        const driverLocation = booking.driver.location;
        const hospitalLocation = booking.hospital.location;
        const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
        const routeKey = `${booking.bookingId}:${phase}`;

        return (
          <Fragment key={booking.bookingId}>
            {phase === "patient" && patientLocation && (
              <OngoingPatientMarker
                longitude={patientLocation.x}
                latitude={patientLocation.y}
              />
            )}
            {driverLocation && (
              <DriverMarker longitude={driverLocation.x} latitude={driverLocation.y} />
            )}
            {phase === "patient" && driverLocation && patientLocation && routes[routeKey] && (
              <MapRoute
                id={`route-${booking.bookingId}-patient`}
                coordinates={routes[routeKey]}
                color="#f59e0b"
                width={4}
                opacity={0.85}
              />
            )}
            {phase === "hospital" && driverLocation && hospitalLocation && routes[routeKey] && (
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

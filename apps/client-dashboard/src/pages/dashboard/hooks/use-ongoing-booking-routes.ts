import { useEffect, useMemo, useState } from "react";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type RouteData = {
  coordinates: [number, number][];
  durationSeconds: number;
};

const routeCache = new globalThis.Map<
  string,
  { coordinates: [number, number][]; durationSeconds: number; updatedAt: number }
>();
const inflightRequests = new globalThis.Map<string, Promise<RouteData | null>>();
const ROUTE_TTL = 1000 * 30;

async function fetchRoute(start: [number, number], end: [number, number]) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch route");
  }
  const data = await response.json();
  const route = data.routes?.[0];
  const coordinates = route?.geometry?.coordinates as [number, number][] | undefined;
  const durationSeconds = route?.duration;
  if (!coordinates || coordinates.length < 2 || !Number.isFinite(durationSeconds)) {
    return null;
  }
  return { coordinates, durationSeconds };
}

export function useOngoingBookingRoutes(ongoingBookings: Record<string, DispatcherBookingPayload>) {
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const driverLocationsQuery = useQuery<Record<string, { x: number; y: number }>>({
    queryKey: queryKeys.driverLocations(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const driverLocations = useMemo(
    () => driverLocationsQuery.data ?? {},
    [driverLocationsQuery.data]
  );
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);

  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      const nextRoutes: Record<string, [number, number][]> = {};
      const nextDurations: Record<string, number> = {};

      for (const booking of ongoingList) {
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        const liveDriverLocation = booking.driver.id ? driverLocations[booking.driver.id] : null;
        const driverLocation = booking.driver.location ?? liveDriverLocation ?? null;
        const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
        const hospitalLocation = booking.hospital.location;
        if (!patientLocation) continue;
        if (!Number.isFinite(patientLocation.x) || !Number.isFinite(patientLocation.y)) continue;

        // ASSIGNED: driver -> patient. ARRIVED/PICKEDUP: patient -> hospital.
        const startPoint = phase === "patient" ? driverLocation : patientLocation;
        const endPoint = phase === "patient" ? patientLocation : hospitalLocation;
        if (!startPoint || !endPoint) continue;
        if (!Number.isFinite(startPoint.x) || !Number.isFinite(startPoint.y)) continue;
        if (!Number.isFinite(endPoint.x) || !Number.isFinite(endPoint.y)) continue;

        const start: [number, number] = [startPoint.x, startPoint.y];
        const end: [number, number] = [endPoint.x, endPoint.y];
        const routeKey = `${booking.bookingId}:${phase}`;
        const cached = routeCache.get(routeKey);
        if (cached && Date.now() - cached.updatedAt < ROUTE_TTL) {
          nextRoutes[routeKey] = cached.coordinates;
          nextDurations[routeKey] = cached.durationSeconds;
          continue;
        }

        try {
          const routePromise =
            inflightRequests.get(routeKey) ??
            fetchRoute(start, end).finally(() => {
              inflightRequests.delete(routeKey);
            });
          if (!inflightRequests.has(routeKey)) {
            inflightRequests.set(routeKey, routePromise);
          }

          const routeData = await routePromise;
          if (routeData) {
            routeCache.set(routeKey, {
              coordinates: routeData.coordinates,
              durationSeconds: routeData.durationSeconds,
              updatedAt: Date.now(),
            });
            nextRoutes[routeKey] = routeData.coordinates;
            nextDurations[routeKey] = routeData.durationSeconds;
          }
        } catch (routeError) {
          console.error("Route fetch failed", routeError);
        }
      }

      if (isMounted) {
        setRoutes((prev) => ({ ...prev, ...nextRoutes }));
        setDurations((prev) => ({ ...prev, ...nextDurations }));
      }
    };

    if (ongoingList.length > 0) {
      loadRoutes();
    }

    return () => {
      isMounted = false;
    };
  }, [driverLocations, ongoingList]);

  return { routes, durations, ongoingList };
}

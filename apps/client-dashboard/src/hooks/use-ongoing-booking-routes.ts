import { useEffect, useMemo, useState } from "react";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

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

export function useOngoingBookingRoutes(ongoingBookings: Record<string, DispatcherBookingPayload>) {
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);

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
          if (coordinates && coordinates.length >= 2) {
            routeCache.set(routeKey, { coordinates, updatedAt: Date.now() });
            nextRoutes[routeKey] = coordinates;
          }
        } catch (routeError) {
          console.error("Route fetch failed", routeError);
        }
      }

      if (isMounted) {
        setRoutes((prev) => ({ ...prev, ...nextRoutes }));
      }
    };

    if (ongoingList.length > 0) {
      loadRoutes();
    }

    return () => {
      isMounted = false;
    };
  }, [ongoingList]);

  return { routes, ongoingList };
}

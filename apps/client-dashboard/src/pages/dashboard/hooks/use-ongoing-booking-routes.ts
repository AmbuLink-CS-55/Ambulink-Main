import { useMemo } from "react";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type RouteData = {
  coordinates: [number, number][];
  durationSeconds: number;
};

async function fetchRoute(start: [number, number], end: [number, number]): Promise<RouteData | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch route");

  const data = await res.json();
  const route = data.routes?.[0];
  const coordinates = route?.geometry?.coordinates as [number, number][] | undefined;
  const durationSeconds = route?.duration;

  if (!coordinates || coordinates.length < 2 || !Number.isFinite(durationSeconds)) return null;
  return { coordinates, durationSeconds };
}

export function useOngoingBookingRoutes(ongoingBookings: Record<string, DispatcherBookingPayload>) {
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);

  const driverLocations = useQuery<Record<string, { x: number; y: number }>>({
    queryKey: queryKeys.driverLocations(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  }).data ?? {};

  const routeQueries = useQueries({
    queries: ongoingList.map((booking) => {
      const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
      const patientLocation = booking.pickupLocation ?? booking.patient.location;
      const driverLocation = booking.driver.location ?? (booking.driver.id ? driverLocations[booking.driver.id] : null);

      const startPoint = phase === "patient" ? driverLocation : patientLocation;
      const endPoint = phase === "patient" ? patientLocation : booking.hospital.location;

      const isValid = [startPoint, endPoint].every(
        (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)
      );

      const start: [number, number] = [startPoint?.x ?? 0, startPoint?.y ?? 0];
      const end: [number, number] = [endPoint?.x ?? 0, endPoint?.y ?? 0];

      return {
        queryKey: ["route", booking.bookingId, phase],
        queryFn: () => fetchRoute(start, end),
        enabled: isValid,
        staleTime: 1000 * 30,
      };
    }),
  });

  const routes: Record<string, [number, number][]> = {};
  const durations: Record<string, number> = {};

  ongoingList.forEach((booking, i) => {
    const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
    const routeKey = `${booking.bookingId}:${phase}`;
    const data = routeQueries[i]?.data;
    if (data) {
      routes[routeKey] = data.coordinates;
      durations[routeKey] = data.durationSeconds;
    }
  });

  return { routes, durations, ongoingList };
}

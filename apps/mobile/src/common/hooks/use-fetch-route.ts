import { useState, useEffect } from "react";
import { Point } from "react-native-maps";

type RouteCoordinate = { latitude: number; longitude: number };

export const useFetchRoute = (start?: Point, end?: Point) => {
  const [routeCoords, setRouteCoords] = useState<RouteCoordinate[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const startX = start?.x;
  const startY = start?.y;
  const endX = end?.x;
  const endY = end?.y;

  useEffect(() => {
    if (![startX, startY, endX, endY].every(Number.isFinite)) {
      setRouteCoords([]);
      setDurationSeconds(null);
      return;
    }

    let isCancelled = false;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startX},${startY};${endX},${endY}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Route request failed with status ${response.status}`);
        }
        const data = await response.json();
        const route = data.routes?.[0];

        if (route?.geometry?.coordinates?.length > 0) {
          const formattedCoords = route.geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          if (!isCancelled) {
            setRouteCoords(formattedCoords);
            setDurationSeconds(Number.isFinite(route.duration) ? route.duration : null);
          }
        } else {
          if (!isCancelled) {
            setRouteCoords([]);
            setDurationSeconds(null);
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        if (!isCancelled) {
          setRouteCoords([]);
          setDurationSeconds(null);
        }
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [startX, startY, endX, endY]);

  return { routeCoords, durationSeconds };
};

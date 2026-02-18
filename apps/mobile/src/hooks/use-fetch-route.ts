import { useState, useEffect } from "react";
import { Point } from "react-native-maps";

export const useFetchRoute = (start?: Point, end?: Point) => {
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.x},${start.y};${end.x},${end.y}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const formattedCoords = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoords(formattedCoords);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [start?.x, start?.y, end?.x, end?.y]);

  return routeCoords;
};

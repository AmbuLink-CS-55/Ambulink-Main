import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { Point } from "@ambulink/types";

type LocationData = Point & {
  accuracy: number | null;
};

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          setLoading(false);
          return;
        }
        const cached = await Location.getLastKnownPositionAsync();
        if (cached)
          setLocation({
            x: cached.coords.longitude,
            y: cached.coords.latitude,
            accuracy: cached.coords.accuracy,
          });

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          mayShowUserSettingsDialog: false,
        });

        setLocation({
          x: currentLocation.coords.longitude,
          y: currentLocation.coords.latitude,
          accuracy: currentLocation.coords.accuracy,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, error, loading };
};

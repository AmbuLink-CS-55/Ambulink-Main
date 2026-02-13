import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { LatLng } from "react-native-maps";

type LocationData = LatLng & {
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
            latitude: cached.coords.latitude,
            longitude: cached.coords.longitude,
            accuracy: cached.coords.accuracy,
          });

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          mayShowUserSettingsDialog: false,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
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

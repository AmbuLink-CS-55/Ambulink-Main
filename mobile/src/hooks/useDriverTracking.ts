import * as Location from 'expo-location';
import { useEffect } from 'react';
import { LOCATION_TASK_NAME } from '../task/locationTasks';

export const useDriverTracking = (isDriver: boolean) => {
  useEffect(() => {
    const startTracking = async () => {
      if (!isDriver) return;

      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();

      if (fg === 'granted' && bg === 'granted') {
        console.log("tracking location")
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 5, // 5 m
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            killServiceOnDestroy: true,
            notificationTitle: "Ambulance Active",
            notificationBody: "Live location is being shared with dispatch.",
          },
        });
      }
    };

    startTracking();

    return () => {
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then((isRunning) => {
        if (isRunning) {
          Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          console.log("Tracking stopped.");
        }
      });
    }
  }, [isDriver]);
};

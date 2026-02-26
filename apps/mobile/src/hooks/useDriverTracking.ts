import * as Location from "expo-location";
import { useEffect } from "react";
import { LOCATION_TASK_NAME } from "@/tasks/locationTasks";

export const useDriverTracking = (isDriver: boolean) => {
  useEffect(() => {
    const stopTracking = async () => {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.info("[driver] Location tracking stopped");
      }
    };

    const startTracking = async () => {
      if (!isDriver) {
        await stopTracking();
        return;
      }

      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();

      if (fg === "granted" && bg === "granted") {
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
      stopTracking();
    };
  }, [isDriver]);
};

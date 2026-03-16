import * as Location from "expo-location";
import { useEffect } from "react";
import { LOCATION_TASK_NAME } from "@/common/tasks/locationTasks";
import { postDriverLocation } from "@/common/lib/driverEvents";

const isMissingTaskError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("TaskNotFoundException") ||
    message.includes("Task not found") ||
    message.includes("background-location-task")
  );
};

export const useDriverTracking = (isDriver: boolean, driverId?: string) => {
  useEffect(() => {
    let foregroundSubscription: Location.LocationSubscription | null = null;

    const postLocation = async (latitude: number, longitude: number) => {
      if (!driverId) return;
      await postDriverLocation({
        driverId,
        y: latitude,
        x: longitude,
      });
    };

    const stopTracking = async () => {
      if (foregroundSubscription) {
        foregroundSubscription.remove();
        foregroundSubscription = null;
      }
      try {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!isRunning) return;
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.info("[driver] Location tracking stopped");
      } catch (error) {
        if (isMissingTaskError(error)) {
          return;
        }
        console.warn("[driver] failed to stop location tracking", error);
      }
    };

    const startTracking = async () => {
      if (!isDriver) {
        await stopTracking();
        return;
      }
      if (!driverId) {
        await stopTracking();
        return;
      }

      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== "granted") {
        await stopTracking();
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await postLocation(current.coords.latitude, current.coords.longitude);
      } catch (error) {
        console.warn("[driver] failed to post current location", error);
      }

      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg === "granted") {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isRunning) return;
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
        return;
      }

      foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 5,
        },
        (location) => {
          postLocation(location.coords.latitude, location.coords.longitude).catch((error) => {
            console.warn("[driver] failed to post foreground location", error);
          });
        }
      );
    };

    startTracking().catch((error) => {
      console.warn("[driver] failed to start location tracking", error);
    });

    return () => {
      stopTracking().catch((error) => {
        console.warn("[driver] failed during tracking cleanup", error);
      });
    };
  }, [driverId, isDriver]);
};

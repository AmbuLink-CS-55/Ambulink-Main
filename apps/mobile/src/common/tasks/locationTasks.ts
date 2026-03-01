import * as TaskManager from "expo-task-manager";
import { env } from "../../../env";
import { postDriverLocation } from "@/common/lib/driverEvents";

export const LOCATION_TASK_NAME = "background-location-task";

type LocationTaskPayload = {
  locations?: {
    coords: {
      latitude: number;
      longitude: number;
    };
  }[];
};

TaskManager.defineTask<LocationTaskPayload>(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;

  const location = data?.locations?.[0];
  if (!location) {
    return;
  }

  await postDriverLocation({
    driverId: env.EXPO_PUBLIC_DRIVER_ID,
    y: location.coords.latitude,
    x: location.coords.longitude,
  });
});

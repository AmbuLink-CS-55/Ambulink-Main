import * as TaskManager from "expo-task-manager";
import { postDriverLocation } from "@/common/lib/driverEvents";
import { getAuthUser } from "@/common/hooks/AuthContext";

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
  const user = getAuthUser();
  if (!user || user.role !== "driver") {
    return;
  }

  const location = data?.locations?.[0];
  if (!location) {
    return;
  }

  await postDriverLocation({
    driverId: user.id,
    y: location.coords.latitude,
    x: location.coords.longitude,
  });
});

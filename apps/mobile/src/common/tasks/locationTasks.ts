import * as TaskManager from "expo-task-manager";
import { env } from "../../../env";
import { postDriverLocation } from "@/common/lib/driverEvents";

export const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      await postDriverLocation({
        driverId: env.EXPO_PUBLIC_DRIVER_ID,
        y: location.coords.latitude,
        x: location.coords.longitude,
      });
    }
  }
});

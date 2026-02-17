import * as TaskManager from "expo-task-manager";
import { SocketClientCreator } from "@/utils/socket";

export const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      const socket = await SocketClientCreator.getSocket("DRIVER");
      socket.emit("driver:update", {
        y: location.coords.latitude,
        x: location.coords.longitude,
      });
    }
  }
});

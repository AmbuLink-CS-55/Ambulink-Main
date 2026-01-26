import * as TaskManager from 'expo-task-manager';
import { SocketClientCreator } from "@/src/socket";

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  console.log("tracking")
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      const socket = await SocketClientCreator.getSocket("DRIVER");
      socket.emit("driver:location_update", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        driverId: "1",
      });
    }
  }
});

import { apiPost } from "./api";
import type { DriverCommand, DriverLocationCommand, DriverShiftCommand } from "@ambulink/types";
import { env } from "../../../env";

export async function postDriverLocation(payload: DriverLocationCommand) {
  return apiPost<{ ok: boolean }, DriverLocationCommand>("/api/drivers/events/location", payload, {
    driverId: env.EXPO_PUBLIC_DRIVER_ID,
  });
}

export async function postDriverArrived(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/arrived", payload, {
    driverId: env.EXPO_PUBLIC_DRIVER_ID,
  });
}

export async function postDriverCompleted(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/completed", payload, {
    driverId: env.EXPO_PUBLIC_DRIVER_ID,
  });
}

export async function postDriverShift(payload: DriverShiftCommand) {
  return apiPost<
    { ok: boolean; status: "AVAILABLE" | "OFFLINE"; onShift: boolean },
    DriverShiftCommand
  >("/api/drivers/events/shift", payload, {
    driverId: env.EXPO_PUBLIC_DRIVER_ID,
  });
}

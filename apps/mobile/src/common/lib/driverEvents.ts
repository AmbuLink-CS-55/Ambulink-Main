import { apiPost } from "./api";
import type { DriverCommand, DriverLocationCommand, DriverShiftCommand } from "@ambulink/types";

export async function postDriverLocation(payload: DriverLocationCommand) {
  return apiPost<{ ok: boolean }, DriverLocationCommand>("/api/drivers/events/location", payload, {
    driverId: payload.driverId,
  });
}

export async function postDriverArrived(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/arrived", payload, {
    driverId: payload.driverId,
  });
}

export async function postDriverCompleted(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/completed", payload, {
    driverId: payload.driverId,
  });
}

export async function postDriverShift(payload: DriverShiftCommand) {
  return apiPost<
    { ok: boolean; status: "AVAILABLE" | "OFFLINE"; onShift: boolean },
    DriverShiftCommand
  >("/api/drivers/events/shift", payload, {
    driverId: payload.driverId,
  });
}

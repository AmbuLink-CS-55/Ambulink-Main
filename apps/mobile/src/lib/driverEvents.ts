import { apiPost } from "./api";
import type { DriverCommand, DriverLocationCommand } from "@ambulink/types";

export async function postDriverLocation(payload: DriverLocationCommand) {
  return apiPost<{ ok: boolean }, DriverLocationCommand>(
    "/api/drivers/events/location",
    payload
  );
}

export async function postDriverArrived(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/arrived", payload);
}

export async function postDriverCompleted(payload: DriverCommand) {
  return apiPost<{ ok: boolean }, DriverCommand>("/api/drivers/events/completed", payload);
}

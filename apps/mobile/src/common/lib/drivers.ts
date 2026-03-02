import type { NearbyDriver } from "@ambulink/types";
import { apiGet } from "./api";

export type { NearbyDriver } from "@ambulink/types";

export async function fetchNearbyDrivers(
  x: number,
  y: number,
  options?: { limit?: number }
): Promise<NearbyDriver[]> {
  return apiGet<NearbyDriver[]>("/api/drivers/nearby", {
    lat: y,
    lng: x,
    limit: options?.limit ?? 6,
  });
}

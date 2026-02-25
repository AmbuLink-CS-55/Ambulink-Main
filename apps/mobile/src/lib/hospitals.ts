import type { Hospital, Point } from "@ambulink/types";

import { apiGet } from "./api";

export type NearbyHospital = Omit<Hospital, "location"> & {
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export async function fetchNearbyHospitals(
  x: number,
  y: number,
  options?: { limit?: number; radiusKm?: number }
): Promise<NearbyHospital[]> {
  return apiGet<NearbyHospital[]>("/api/hospitals/nearby", {
    lat: y,
    lng: x,
    limit: options?.limit ?? 6,
    radiusKm: options?.radiusKm ?? 10,
  });
}

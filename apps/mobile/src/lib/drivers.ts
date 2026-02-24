import type { Point } from "@ambulink/types";

import { apiGet } from "./api";

export type NearbyDriver = {
  id: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  providerId?: string | null;
  status?: string | null;
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export async function fetchNearbyDrivers(
  lat: number,
  lng: number,
  options?: { limit?: number }
): Promise<NearbyDriver[]> {
  return apiGet<NearbyDriver[]>("/api/drivers/nearby", {
    lat,
    lng,
    limit: options?.limit ?? 6,
  });
}

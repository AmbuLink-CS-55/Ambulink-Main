import { sql } from "drizzle-orm";

import * as schema from "@/core/database/schema";

import type { SeedDb } from "../types";

export async function seedAmbulances(db: SeedDb, providerId: string) {
  await db.insert(schema.ambulance).values([
    {
      providerId,
      vehicleNumber: "WP CBA 4567",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8618, 6.9282), 4326)`,
    },
    {
      providerId,
      vehicleNumber: "WP NC 9182",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8668, 6.9147), 4326)`,
    },
    {
      providerId,
      vehicleNumber: "WP KA 2741",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8842, 6.8506), 4326)`,
    },
    {
      providerId,
      vehicleNumber: "WP PK 6630",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
    },
    {
      providerId,
      vehicleNumber: "WP PF 7742",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8756, 6.8951), 4326)`,
    },
    {
      providerId,
      vehicleNumber: "WP BA 3398",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
    },
  ]);
}

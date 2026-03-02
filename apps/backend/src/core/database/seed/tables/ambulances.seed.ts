import { sql } from "drizzle-orm";

import * as schema from "@/core/database/schema";

import { PROVIDER_SEED_IDS } from "../seed-ids";
import type { SeedDb } from "../types";

export async function seedAmbulances(db: SeedDb) {
  await db.insert(schema.ambulance).values([
    {
      providerId: PROVIDER_SEED_IDS.ambulinkPrivate,
      vehicleNumber: "WP CBA 4567",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8618, 6.9282), 4326)`,
    },
    {
      providerId: PROVIDER_SEED_IDS.suwaSeriyaColomboCentral,
      vehicleNumber: "WP NC 9182",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8668, 6.9147), 4326)`,
    },
    {
      providerId: PROVIDER_SEED_IDS.suwaSeriyaColomboSouth,
      vehicleNumber: "WP KA 2741",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8842, 6.8506), 4326)`,
    },
    {
      providerId: PROVIDER_SEED_IDS.lankaHospitals,
      vehicleNumber: "WP PK 6630",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
    },
    {
      providerId: PROVIDER_SEED_IDS.asiriEms,
      vehicleNumber: "WP PF 7742",
      equipmentLevel: "ALS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8756, 6.8951), 4326)`,
    },
    {
      providerId: PROVIDER_SEED_IDS.nawalokaAmbulance,
      vehicleNumber: "WP BA 3398",
      equipmentLevel: "BLS",
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
    },
  ]);
}

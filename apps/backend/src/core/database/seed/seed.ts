import "dotenv/config";

import * as schema from "@/core/database/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { reset } from "drizzle-seed";
import { sql } from "drizzle-orm";

import { seedAmbulanceProviders } from "./tables/ambulance-providers.seed";
import { seedUsers } from "./tables/users.seed";
import { seedAmbulances } from "./tables/ambulances.seed";
import { seedHospitals } from "./tables/hospitals.seed";
import { seedHelplines } from "./tables/helplines.seed";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run seeds");
}

const client = postgres(databaseUrl, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log("🌱 Starting manual seed process...");
  console.log("═".repeat(60));

  console.log("🗑️  Resetting database...");
  await reset(db, schema);

  console.log("🚑 Seeding ambulance providers...");
  const providerId = await seedAmbulanceProviders(db);

  console.log("👤 Seeding users...");
  await seedUsers(db, providerId);

  console.log("🚐 Seeding ambulances...");
  await seedAmbulances(db, providerId);

  console.log("🏥 Seeding hospitals...");
  await seedHospitals(db);

  console.log("📞 Seeding helplines...");
  await seedHelplines(db);

  console.log("📍 Normalizing PostGIS SRIDs...");
  await db.execute(
    sql`UPDATE users SET current_location = ST_SetSRID(current_location, 4326) WHERE current_location IS NOT NULL AND ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE ambulances SET current_location = ST_SetSRID(current_location, 4326) WHERE current_location IS NOT NULL AND ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE hospitals SET location = ST_SetSRID(location, 4326) WHERE location IS NOT NULL AND ST_SRID(location) = 0`
  );

  console.log("═".repeat(60));
  console.log("🎉 Manual seeding complete!");

  await client.end();
}

main().catch(async (error) => {
  console.error("❌ Seed failed:", error);
  await client.end();
  process.exit(1);
});

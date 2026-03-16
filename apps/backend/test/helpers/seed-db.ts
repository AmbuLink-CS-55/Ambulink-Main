import * as schema from "../../src/core/database/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { reset } from "drizzle-seed";
import { sql } from "drizzle-orm";

import { seedAmbulanceProviders } from "../../src/core/database/seed/tables/ambulance-providers.seed";
import { seedUsers } from "../../src/core/database/seed/tables/users.seed";
import { seedAmbulances } from "../../src/core/database/seed/tables/ambulances.seed";
import { seedHospitals } from "../../src/core/database/seed/tables/hospitals.seed";
import { seedHelplines } from "../../src/core/database/seed/tables/helplines.seed";

export async function seedTestDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    await reset(db, schema);

    const providerId = await seedAmbulanceProviders(db);
    await seedUsers(db, providerId);
    await seedAmbulances(db, providerId);
    await seedHospitals(db);
    await seedHelplines(db);

    await db.execute(
      sql`UPDATE users SET current_location = ST_SetSRID(current_location, 4326) WHERE current_location IS NOT NULL AND ST_SRID(current_location) = 0`
    );
    await db.execute(
      sql`UPDATE ambulances SET current_location = ST_SetSRID(current_location, 4326) WHERE current_location IS NOT NULL AND ST_SRID(current_location) = 0`
    );
    await db.execute(
      sql`UPDATE hospitals SET location = ST_SetSRID(location, 4326) WHERE location IS NOT NULL AND ST_SRID(location) = 0`
    );
  } finally {
    await client.end();
  }
}

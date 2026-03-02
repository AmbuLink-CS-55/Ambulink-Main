import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "@/core/database/schema";

export type SeedDb = PostgresJsDatabase<typeof schema>;

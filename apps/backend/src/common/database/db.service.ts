import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "env";

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);
  public readonly db: PostgresJsDatabase<typeof schema>;

  constructor() {
    // Use this for transaction mode (Supabase pooler)
    // change to false for superbase
    const client = postgres(env.DATABASE_URL, { prepare: false });
    this.db = drizzle(client, { schema });
  }

  async onModuleInit() {
    const retries = 10;
    let delay = 1000;
    let lastError: unknown;

    for (let i = 1; i <= retries; i++) {
      try {
        await this.db.execute("SELECT 1");
        this.logger.log("Database connected");
        return;
      } catch (err) {
        lastError = err;

        if (i >= retries) {
          this.logger.error("All database connection attempts failed", err as Error);
          throw (err instanceof Error ? err : new Error("Database connection failed"));
        }

        this.logger.warn(`Database connection failed, retrying ${i} in ${delay}`);
        await new Promise((res) => {
          setTimeout(res, delay);
        });
        delay *= 2;
      }
    }

    throw (
      lastError instanceof Error ? lastError : new Error("Database connection failed after retries")
    );
  }
}

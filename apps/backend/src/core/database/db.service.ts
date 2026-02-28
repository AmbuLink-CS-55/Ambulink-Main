import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "env";

export type DbExecutor = Pick<
  PostgresJsDatabase<typeof schema>,
  "select" | "insert" | "update" | "delete" | "execute"
>;

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  public readonly db: PostgresJsDatabase<typeof schema>;
  private readonly client: postgres.Sql;

  constructor() {
    // Use this for transaction mode (Supabase pooler)
    this.client = postgres(env.DATABASE_URL, { prepare: false });
    this.db = drizzle(this.client, { schema });
  }

  async onModuleInit() {
    if (env.NODE_ENV === "test") {
      this.logger.log("Skipping database connectivity check in test environment");
      return;
    }

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

  async onModuleDestroy() {
    await this.client.end({ timeout: 5 });
  }
}

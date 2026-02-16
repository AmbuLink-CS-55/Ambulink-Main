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
    const retrys = 10;
    let delay = 1000;

    for (let i = 1; i < retrys; i++) {
      try {
        await this.db.execute("SELECT 1");
        this.logger.log("Database connected");
        return;
      } catch (err) {
        this.logger.log(`Database connection failed, retrying ${i} in ${delay}`);
        if (i > retrys) {
          this.logger.log(`all database connection attepts failed`);
          process.exit(0);
        }
        await new Promise((res) => {
          setTimeout(res, delay);
        });
        delay *= 2;
      }
    }
    try {
      await this.db.execute("SELECT 1");
      this.logger.log("Database connected");
    } catch (error) {
      this.logger.error("Database connection failed with error:", error);
      process.exit(1);
    }
  }
}

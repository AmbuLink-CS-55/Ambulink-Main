import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/database/schema";
import env from "env";

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Use this for transaction mode (Supabase pooler)
    // change to false for superbase
    console.log("connecting to:", env.DATABASE_URL);
    const client = postgres(env.DATABASE_URL, { prepare: false });

    this.db = drizzle(client, { schema });
  }

  async onModuleInit() {
    try {
      await this.db.execute('SELECT 1');
      this.logger.log("Database connected");
    } catch (error) {
      this.logger.error("Database connection failed check your .env file for a valid DATABASE_URL");
      process.exit(1);
    }
  }

  getDb() {
    return this.db;
  }
}

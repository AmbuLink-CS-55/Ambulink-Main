import { Injectable } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/database/schema";

@Injectable()
export class DbService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Use this for transaction mode (Supabase pooler)
    // change to false for superbase
    console.log("connecting to:", process.env.DATABASE_URL);
    const client = postgres(
      "postgresql://postgres:123@localhost:5432/postgres",
      {
        prepare: false,
      }
    );
    this.db = drizzle(client, { schema });
  }

  getDb() {
    return this.db;
  }
}

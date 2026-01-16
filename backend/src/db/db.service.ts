import { Injectable } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

@Injectable()
export class DbService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Use this for transaction mode (Supabase pooler)
    // change to false for superbase
    const client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
    });
    this.db = drizzle(client, { schema });
  }

  getDb() {
    return this.db;
  }
}

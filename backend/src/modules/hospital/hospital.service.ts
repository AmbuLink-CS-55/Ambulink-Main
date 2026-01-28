import { DbService } from "@/services/db.service";
import { hospitals } from "@/database/schema";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import Redis from "ioredis";

@Injectable()
export class HospitalService {
  constructor(private db: DbService) {}

  async findTheNearestHospital(lat: number, lng: number) {
    const nearestHospital = await this.db
      .getDb()
      .select()
      .from(hospitals)
      .orderBy(
        sql`${hospitals.location} <-> st_setsrid(st_makepoint(${lng}, ${lat}), 4326)`
      )
      .limit(1);

    return nearestHospital[0];
  }
}

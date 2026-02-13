import { DbService } from "@/common/database/db.service";
import { hospitals } from "@/common/database/schema";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

@Injectable()
export class HospitalService {
  constructor(private dbService: DbService) {}

  async getAll() {
    const data = await this.dbService.db.select().from(hospitals);
    return data;
  }

  async findTheNearestHospital(lat: number, lng: number) {
    const nearestHospital = await this.dbService.db
      .select()
      .from(hospitals)
      .orderBy(
        sql`${hospitals.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`
        // sql`${hospitals.location} <-> st_setsrid(st_makepoint(${lng}, ${lat}), 4326)`
      )
      .limit(1);

    return nearestHospital[0];
  }
}

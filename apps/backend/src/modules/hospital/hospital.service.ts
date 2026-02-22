import { DbService } from "@/common/database/db.service";
import { Injectable } from "@nestjs/common";
import { getAllHospitals, getNearestHospital } from "@/common/queries";

@Injectable()
export class HospitalService {
  constructor(private dbService: DbService) {}

  async getAll() {
    return getAllHospitals(this.dbService.db);
  }

  async findTheNearestHospital(lat: number, lng: number) {
    const nearestHospital = await getNearestHospital(this.dbService.db, lat, lng);
    return nearestHospital[0];
  }
}

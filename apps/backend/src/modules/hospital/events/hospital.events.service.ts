import { Injectable, NotFoundException } from "@nestjs/common";
import type { NearbyHospital } from "@ambulink/types";
import { DbExecutor } from "@/core/database/db.service";
import { HospitalEventsRepository } from "./hospital.events.repository";

@Injectable()
export class HospitalEventsService {
  constructor(private hospitalRepository: HospitalEventsRepository) {}

  async getAll() {
    return this.hospitalRepository.getAllHospitals();
  }

  async getByIdOrThrow(hospitalId: string, db?: DbExecutor) {
    const [hospital] = await this.hospitalRepository.getHospitalById(hospitalId, db);
    if (!hospital) {
      throw new NotFoundException({ code: "HOSPITAL_NOT_FOUND", message: "Hospital not found" });
    }
    return hospital;
  }

  async findTheNearestHospital(lat: number, lng: number) {
    const nearestHospital = await this.hospitalRepository.getNearestHospital(lat, lng);
    return nearestHospital[0];
  }

  async findNearby(
    lat: number,
    lng: number,
    limit: number,
    radiusKm: number
  ): Promise<NearbyHospital[]> {
    const rows = await this.hospitalRepository.getNearbyHospitals(lat, lng, limit, radiusKm);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      hospitalType: row.hospitalType,
      address: row.address,
      phoneNumber: row.phoneNumber,
      isActive: row.isActive,
      location:
        row.locationX !== null && row.locationY !== null
          ? { x: row.locationX, y: row.locationY }
          : null,
      distanceMeters: Number(row.distanceMeters),
      distanceKm: Number((Number(row.distanceMeters) / 1000).toFixed(2)),
    }));
  }
}

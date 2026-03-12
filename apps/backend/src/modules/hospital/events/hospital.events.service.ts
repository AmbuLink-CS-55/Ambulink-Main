import { Injectable, NotFoundException } from "@nestjs/common";
import { DbExecutor } from "@/core/database/db.service";
import { HospitalEventsRepository } from "./hospital.events.repository";

@Injectable()
export class HospitalEventsService {
  constructor(private hospitalRepository: HospitalEventsRepository) {}

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
}

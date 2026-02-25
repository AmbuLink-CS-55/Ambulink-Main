import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import type { CreatePatientDto, UpdatePatientDto } from "@/common/validation/schemas";
import {
  createPatient,
  findAllPatients,
  findPatientById,
  updatePatient,
  removePatient,
  updateUserStatus,
  updateUserLocation,
} from "@/common/queries";

@Injectable()
export class PatientService {
  constructor(private dbService: DbService) {}

  async updateStatus(patientId: string, status: UserStatus) {
    return await updateUserStatus(this.dbService.db, patientId, status);
  }

  async updateLocation(patientId: string, location: { x: number; y: number }) {
    return await updateUserLocation(this.dbService.db, patientId, location);
  }

  async create(createPatientDto: CreatePatientDto) {
    const result = await createPatient(this.dbService.db, createPatientDto);
    return result[0];
  }

  async findAll(isActive?: boolean) {
    return findAllPatients(this.dbService.db, isActive);
  }

  async findOne(id: string) {
    const result = await findPatientById(this.dbService.db, id);

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    const result = await updatePatient(this.dbService.db, id, updatePatientDto);

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await removePatient(this.dbService.db, id);
  }
}

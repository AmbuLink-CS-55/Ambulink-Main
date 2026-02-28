import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import type { CreatePatientDto, UpdatePatientDto } from "@/common/validation/schemas";
import { PatientRepository } from "./patient.repository";

@Injectable()
export class PatientService {
  constructor(private patientRepository: PatientRepository) {}

  async updateStatus(patientId: string, status: UserStatus) {
    return await this.patientRepository.updateUserStatus(patientId, status);
  }

  async updateLocation(patientId: string, location: { x: number; y: number }) {
    return await this.patientRepository.updateUserLocation(patientId, location);
  }

  async create(createPatientDto: CreatePatientDto) {
    const result = await this.patientRepository.createPatient(createPatientDto);
    return result[0];
  }

  async findAll(isActive?: boolean) {
    return this.patientRepository.findAllPatients(isActive);
  }

  async findOne(id: string) {
    const result = await this.patientRepository.findPatientById(id);

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    const result = await this.patientRepository.updatePatient(id, updatePatientDto);

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.patientRepository.removePatient(id);
  }
}

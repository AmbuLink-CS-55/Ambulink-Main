import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DbService } from "@/services/db.service";
import { users } from "@/database/schema";
import type {
  InsertPatientDto,
  PatientDto,
} from "@/common/dto/patient.schema";
import { DriverDto } from "@/common/dto/driver.schema";

@Injectable()
export class PatientService {
  // patientID : socketID

  constructor(private db: DbService) { }

  async create(createPatientDto: InsertPatientDto): Promise<DriverDto> {
    const patientData = {
      ...createPatientDto,
      role: "PATIENT" as const,
    };

    const result = await this.db
      .getDb()
      .insert(users)
      .values(patientData)
      .returning();
    return result[0];
  }

  async findAll(isActive?: boolean): Promise<PatientDto[]> {
    const conditions = [eq(users.role, "PATIENT" as const)];

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.db
      .getDb()
      .select()
      .from(users)
      .where(and(...conditions));
  }

  async findOne(id: string): Promise<PatientDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "PATIENT")));

    if (result.length === 0) {
      throw new Error(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: string,
    updatePatientDto: Partial<InsertPatientDto>
  ): Promise<PatientDto> {
    await this.findOne(id);

    const result = await this.db
      .getDb()
      .update(users)
      .set({
        ...updatePatientDto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db
      .getDb()
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}

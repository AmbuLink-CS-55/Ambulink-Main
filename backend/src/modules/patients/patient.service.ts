import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { users } from "@/common/database/schema";
import type {
  InsertPatientDto,
  SelectPatientDto,
} from "@/common/dto/patient.schema";
import { SelectDriverDto } from "@/common/dto/driver.schema";
import { DbService } from "@/common/database/db.service";

@Injectable()
export class PatientService {
  // patientID : socketID

  constructor(private dbService: DbService) {}

  async create(createPatientDto: InsertPatientDto): Promise<SelectPatientDto> {
    const patientData = {
      ...createPatientDto,
      role: "PATIENT" as const,
    };

    const result = await this.dbService.db
      .insert(users)
      .values(patientData)
      .returning();
    return result[0];
  }

  async findAll(isActive?: boolean): Promise<SelectPatientDto[]> {
    const conditions = [eq(users.role, "PATIENT" as const)];

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.dbService.db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  async findOne(id: string): Promise<SelectPatientDto> {
    const result = await this.dbService.db
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
  ): Promise<SelectPatientDto> {
    await this.findOne(id);

    const result = await this.dbService.db
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
    await this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}

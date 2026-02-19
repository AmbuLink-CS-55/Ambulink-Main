import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, inArray } from "drizzle-orm";
import { bookings, User, users, UserStatus } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import type { CreatePatientDto, UpdatePatientDto } from "@/common/validation/schemas";

@Injectable()
export class PatientService {
  // patientID : socketID

  constructor(private dbService: DbService) {}

  async updateStatus(patientId: string, status: UserStatus) {
    return await this.dbService.db
      .update(users)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(users.id, patientId))
      .returning();
  }

  async updateLocation(patientId: string, location: { x: number; y: number }) {
    return await this.dbService.db
      .update(users)
      .set({ currentLocation: location, lastLocationUpdate: new Date(), updatedAt: new Date() })
      .where(eq(users.id, patientId))
      .returning();
  }

  async create(createPatientDto: CreatePatientDto): Promise<User> {
    const patientData = {
      ...createPatientDto,
      role: "PATIENT" as const,
    };

    const result = await this.dbService.db.insert(users).values(patientData).returning();
    return result[0];
  }

  async findAll(isActive?: boolean): Promise<User[]> {
    const conditions = [eq(users.role, "PATIENT" as const)];

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.dbService.db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  async findOne(id: string): Promise<User> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "PATIENT")));

    if (result.length === 0) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<User> {
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

import { Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { users } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import type { NewUser, UserStatus } from "@/common/database/schema";

@Injectable()
export class PatientRepository {
  constructor(private dbService: DbService) {}

  createPatient(patient: Omit<NewUser, "role">) {
    return this.dbService.db
      .insert(users)
      .values({
        ...patient,
        role: "PATIENT",
      })
      .returning();
  }

  findAllPatients(isActive?: boolean) {
    const conditions = [eq(users.role, "PATIENT" as const)];

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.dbService.db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  findPatientById(id: string) {
    return this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "PATIENT")));
  }

  updatePatient(id: string, patient: Partial<NewUser>) {
    return this.dbService.db
      .update(users)
      .set({
        ...patient,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
  }

  removePatient(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  updateUserStatus(userId: string, status: UserStatus) {
    return this.dbService.db
      .update(users)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
  }

  updateUserLocation(userId: string, location: { x: number; y: number }) {
    return this.dbService.db
      .update(users)
      .set({ currentLocation: location, lastLocationUpdate: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
  }
}

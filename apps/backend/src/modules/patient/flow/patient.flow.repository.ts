import { Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { users } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import type { NewUser, UserStatus } from "@/core/database/schema";

@Injectable()
export class PatientFlowRepository {
  constructor(private dbService: DbService) {}

  private readonly safeUserColumns = {
    id: users.id,
    fullName: users.fullName,
    phoneNumber: users.phoneNumber,
    email: users.email,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    isActive: users.isActive,
    lastLoginAt: users.lastLoginAt,
    role: users.role,
    providerId: users.providerId,
    currentLocation: users.currentLocation,
    lastLocationUpdate: users.lastLocationUpdate,
    status: users.status,
    subscribedBookingId: users.subscribedBookingId,
  };

  createPatient(patient: Omit<NewUser, "role">, db: DbExecutor = this.dbService.db) {
    return db
      .insert(users)
      .values({
        ...patient,
        role: "PATIENT",
      })
      .returning(this.safeUserColumns);
  }

  findAllPatients(isActive?: boolean) {
    const conditions = [eq(users.role, "PATIENT" as const)];

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.dbService.db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(...conditions));
  }

  findPatientById(id: string, db: DbExecutor = this.dbService.db) {
    return db
      .select(this.safeUserColumns)
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
      .returning(this.safeUserColumns);
  }

  removePatient(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  updateUserStatus(userId: string, status: UserStatus, db: DbExecutor = this.dbService.db) {
    return db
      .update(users)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(this.safeUserColumns);
  }

  updateUserLocation(
    userId: string,
    location: { x: number; y: number },
    db: DbExecutor = this.dbService.db
  ) {
    return db
      .update(users)
      .set({ currentLocation: location, lastLocationUpdate: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(this.safeUserColumns);
  }
}

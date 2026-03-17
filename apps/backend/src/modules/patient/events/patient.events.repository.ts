import { Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { patientGuestSessions, users } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import type { NewUser, UserStatus } from "@/core/database/schema";

@Injectable()
export class PatientEventsRepository {
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

  findPatientById(id: string, db: DbExecutor = this.dbService.db) {
    return db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "PATIENT")));
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

  createGuestSession(
    input: { patientId: string; tokenHash: string; expiresAt: Date },
    db: DbExecutor = this.dbService.db
  ) {
    return db
      .insert(patientGuestSessions)
      .values({
        patientId: input.patientId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        status: "ACTIVE",
      })
      .returning({
        id: patientGuestSessions.id,
        patientId: patientGuestSessions.patientId,
        bookingId: patientGuestSessions.bookingId,
        status: patientGuestSessions.status,
        expiresAt: patientGuestSessions.expiresAt,
      });
  }

  attachSessionBooking(sessionId: string, bookingId: string, db: DbExecutor = this.dbService.db) {
    return db
      .update(patientGuestSessions)
      .set({
        bookingId,
        updatedAt: new Date(),
      })
      .where(eq(patientGuestSessions.id, sessionId));
  }

  updateGuestSessionStatusByPatient(patientId: string, status: "COMPLETED" | "CANCELLED") {
    return this.dbService.db
      .update(patientGuestSessions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(patientGuestSessions.patientId, patientId), eq(patientGuestSessions.status, "ACTIVE")));
  }
}

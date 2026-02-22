import { eq, and } from "drizzle-orm";
import { users } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { NewUser, UserStatus } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createPatient = (db: Db, patient: Omit<NewUser, "role">) =>
  db
    .insert(users)
    .values({
      ...patient,
      role: "PATIENT",
    })
    .returning();

export const findAllPatients = (db: Db, isActive?: boolean) => {
  const conditions = [eq(users.role, "PATIENT" as const)];

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  return db
    .select()
    .from(users)
    .where(and(...conditions));
};

export const findPatientById = (db: Db, id: string) =>
  db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "PATIENT")));

export const updatePatient = (db: Db, id: string, patient: Partial<NewUser>) =>
  db
    .update(users)
    .set({
      ...patient,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

export const removePatient = (db: Db, id: string) =>
  db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, id));

export const updateUserStatus = (db: Db, userId: string, status: UserStatus) =>
  db
    .update(users)
    .set({ status: status, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

export const updateUserLocation = (db: Db, userId: string, location: { x: number; y: number }) =>
  db
    .update(users)
    .set({ currentLocation: location, lastLocationUpdate: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

export type CreatePatientResult = Awaited<ReturnType<typeof createPatient>>;
export type FindAllPatientsResult = Awaited<ReturnType<typeof findAllPatients>>;
export type FindPatientByIdResult = Awaited<ReturnType<typeof findPatientById>>;
export type UpdatePatientResult = Awaited<ReturnType<typeof updatePatient>>;
export type UpdateUserStatusResult = Awaited<ReturnType<typeof updateUserStatus>>;
export type UpdateUserLocationResult = Awaited<ReturnType<typeof updateUserLocation>>;

import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { users } from "@/core/database/schema";
import type { NewUser, UserStatus } from "@/core/database/schema";

@Injectable()
export class EmtFlowRepository {
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
    status: users.status,
    subscribedBookingId: users.subscribedBookingId,
  };

  createEmt(emt: Omit<NewUser, "role">) {
    return this.dbService.db
      .insert(users)
      .values({
        fullName: emt.fullName,
        phoneNumber: emt.phoneNumber,
        email: emt.email,
        passwordHash: emt.passwordHash,
        role: "EMT",
        providerId: emt.providerId as string | null,
      })
      .returning(this.safeUserColumns);
  }

  findAllEmts(providerId?: string, isActive?: boolean, status?: UserStatus) {
    const conditions = [eq(users.role, "EMT" as const)];

    if (providerId) {
      conditions.push(eq(users.providerId, providerId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    if (status) {
      conditions.push(eq(users.status, status));
    }

    return this.dbService.db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(...conditions));
  }

  findEmtById(id: string, db: DbExecutor = this.dbService.db) {
    return db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "EMT")));
  }

  setEmtStatus(emtId: string, status: UserStatus, db: DbExecutor = this.dbService.db) {
    return db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, emtId), eq(users.role, "EMT")))
      .returning(this.safeUserColumns);
  }

  updateEmt(id: string, emt: Partial<NewUser>) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (emt.fullName !== undefined) updateData.fullName = emt.fullName;
    if (emt.phoneNumber !== undefined) updateData.phoneNumber = emt.phoneNumber;
    if (emt.email !== undefined) updateData.email = emt.email;
    if (emt.passwordHash !== undefined) updateData.passwordHash = emt.passwordHash;
    if (emt.providerId !== undefined) updateData.providerId = emt.providerId as string | null;

    return this.dbService.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.role, "EMT")))
      .returning(this.safeUserColumns);
  }

  removeEmt(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.role, "EMT")));
  }
}

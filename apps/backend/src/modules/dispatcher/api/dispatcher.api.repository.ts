import { Injectable } from "@nestjs/common";
import { and, count, eq, ne } from "drizzle-orm";
import { DbService } from "@/core/database/db.service";
import { users } from "@/core/database/schema";
import type { NewUser, UserStatus } from "@/core/database/schema";

@Injectable()
export class DispatcherApiRepository {
  constructor(private readonly dbService: DbService) {}

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
    isDispatcherAdmin: users.isDispatcherAdmin,
    status: users.status,
    subscribedBookingId: users.subscribedBookingId,
  };

  createDispatcher(dispatcher: Omit<NewUser, "role">) {
    return this.dbService.db
      .insert(users)
      .values({
        fullName: dispatcher.fullName,
        phoneNumber: dispatcher.phoneNumber,
        email: dispatcher.email,
        passwordHash: dispatcher.passwordHash,
        role: "DISPATCHER",
        providerId: dispatcher.providerId as string | null,
        isDispatcherAdmin: false,
      })
      .returning(this.safeUserColumns);
  }

  findAllDispatchers(providerId?: string, isActive?: boolean, status?: UserStatus) {
    const conditions = [eq(users.role, "DISPATCHER" as const)];

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

  findDispatcherById(id: string) {
    return this.dbService.db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DISPATCHER")));
  }

  updateDispatcher(id: string, dispatcher: Partial<NewUser>) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dispatcher.fullName !== undefined) updateData.fullName = dispatcher.fullName;
    if (dispatcher.phoneNumber !== undefined) updateData.phoneNumber = dispatcher.phoneNumber;
    if (dispatcher.email !== undefined) updateData.email = dispatcher.email;
    if (dispatcher.passwordHash !== undefined) updateData.passwordHash = dispatcher.passwordHash;
    if (dispatcher.providerId !== undefined) updateData.providerId = dispatcher.providerId as string | null;

    return this.dbService.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.role, "DISPATCHER")))
      .returning(this.safeUserColumns);
  }

  removeDispatcher(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.role, "DISPATCHER")));
  }

  countActiveAdmins(providerId: string, excludeId?: string) {
    const conditions = [
      eq(users.role, "DISPATCHER"),
      eq(users.providerId, providerId),
      eq(users.isActive, true),
      eq(users.isDispatcherAdmin, true),
    ];

    if (excludeId) {
      conditions.push(ne(users.id, excludeId));
    }

    return this.dbService.db
      .select({ value: count() })
      .from(users)
      .where(and(...conditions));
  }
}

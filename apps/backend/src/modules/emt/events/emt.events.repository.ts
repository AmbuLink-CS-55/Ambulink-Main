import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { users } from "@/core/database/schema";
import type { UserStatus } from "@/core/database/schema";

@Injectable()
export class EmtEventsRepository {
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

}

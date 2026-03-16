import { Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { ambulanceProviders, users } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import type { UserStatus } from "@/core/database/schema";

@Injectable()
export class DispatcherEventsRepository {
  constructor(private dbService: DbService) {}

  setDispatcherStatus(dispatcherId: string, status: UserStatus) {
    return this.dbService.db
      .update(users)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dispatcherId))
      .returning();
  }

  findLiveDispatchersByProvider(providerId: string) {
    return this.dbService.db
      .select({ dispatcherId: users.id })
      .from(users)
      .where(
        and(
          eq(users.status, "AVAILABLE"),
          eq(users.providerId, providerId),
          eq(users.role, "DISPATCHER")
        )
      );
  }

  findAllLiveDispatchersByProvider(providerId: string) {
    return this.dbService.db
      .select({ dispatcherId: users.id })
      .from(users)
      .where(
        and(
          eq(users.status, "AVAILABLE"),
          eq(users.providerId, providerId),
          eq(users.role, "DISPATCHER")
        )
      );
  }

  findAllActiveDispatchersByProvider(providerId: string) {
    return this.dbService.db
      .select({ dispatcherId: users.id })
      .from(users)
      .where(
        and(
          eq(users.providerId, providerId),
          eq(users.role, "DISPATCHER"),
          eq(users.isActive, true)
        )
      );
  }

  getDispatcherWinnerInfo(winnerDispatcherId: string) {
    return this.dbService.db
      .select({
        id: users.id,
        name: users.fullName,
        providerName: ambulanceProviders.name,
      })
      .from(users)
      .leftJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
      .where(eq(users.id, winnerDispatcherId));
  }

  findDispatcherById(dispatcherId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({
        id: users.id,
        fullName: users.fullName,
        providerId: users.providerId,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, dispatcherId), eq(users.role, "DISPATCHER")));
  }
}

import { Injectable } from "@nestjs/common";
import { DbService } from "@/common/database/db.service";
import { users, UserStatus } from "@/common/database/schema";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";

@Injectable()
export class DispatcherService {
  constructor(private dbService: DbService) {}

  async setStatus(dispatcherId: string, status: UserStatus) {
    await this.dbService.db
      .update(users)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dispatcherId))
      .returning();
  }

  async findLiveDispatchersByProvider(providerId: string) {
    const dispatcher = await this.dbService.db
      .select({ dispatcherId: users.id })
      .from(users)
      .where(
        and(
          eq(users.status, "AVAILABLE"),
          eq(users.providerId, providerId),
          eq(users.role, "DISPATCHER")
        )
      );
    if (dispatcher.length === 0) {
      console.warn("[DispatcherService] No AVAILABLE dispatcher found", {
        providerId,
      });
      return null;
    }
    return dispatcher[0]?.dispatcherId ?? null;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "@/common/database/db.service";
import { users } from "@/common/database/schema";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { id } from "zod/locales";

@Injectable()
export class DispatcherService {
  constructor(private dbService: DbService) { }

  async setStatus(dispatcherId: string, status: "AVAILABLE" | "BUSY" | "OFFLINE") {
    const user = await this.dbService.db
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
    return dispatcher[0].dispatcherId;
  }
}

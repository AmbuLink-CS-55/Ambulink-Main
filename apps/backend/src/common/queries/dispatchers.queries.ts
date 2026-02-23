import { eq, and } from "drizzle-orm";
import { users } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { UserStatus } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const setDispatcherStatus = (db: Db, dispatcherId: string, status: UserStatus) =>
  db
    .update(users)
    .set({
      status: status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, dispatcherId))
    .returning();

export const findLiveDispatchersByProvider = (db: Db, providerId: string) =>
  db
    .select({ dispatcherId: users.id })
    .from(users)
    .where(
      and(
        eq(users.status, "AVAILABLE"),
        eq(users.providerId, providerId),
        eq(users.role, "DISPATCHER")
      )
    );

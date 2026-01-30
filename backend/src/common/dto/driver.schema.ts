import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users, ambulanceProviders } from "@/common/database/schema";
import { uuid } from "drizzle-orm/pg-core";

export const insertDriverSchema = createInsertSchema(users)
  .omit({
    id: true,
    role: true,
  })
  .extend({
    role: z.literal("DRIVER"),
    providerId: uuid("provider_id").references(() => ambulanceProviders.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  });

export const selectDriverSchema = createSelectSchema(users);

export type InsertDriverDto = z.infer<typeof insertDriverSchema>;
export type SelectDriverDto = z.infer<typeof selectDriverSchema>;

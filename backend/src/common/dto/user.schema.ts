import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "@/database/schema";

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const selectUserSchema = createSelectSchema(users);

export type InsertUserDto = z.infer<typeof insertUserSchema>;
export type SelectUserDto = z.infer<typeof selectUserSchema>;

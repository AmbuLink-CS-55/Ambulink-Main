import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "../schema";

export const insertUserSchema = createInsertSchema(user).omit({
  id: true,
});

export const selectUserSchema = createSelectSchema(user);

export type InsertUserDto = z.infer<typeof insertUserSchema>;
export type SelectUserDto = z.infer<typeof selectUserSchema>;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { driver } from "../schema";

export const insertDriverSchema = createInsertSchema(driver).omit({
  id: true,
  createdAt: true,
});

export const selectDriverSchema = createSelectSchema(driver);

export type InsertDriverDto = z.infer<typeof insertDriverSchema>;
export type SelectDriverDto = z.infer<typeof selectDriverSchema>;

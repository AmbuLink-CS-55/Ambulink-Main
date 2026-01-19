import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { emt } from "../schema";

export const insertEmtSchema = createInsertSchema(emt).omit({
  id: true,
  createdAt: true,
});

export const selectEmtSchema = createSelectSchema(emt);

export type InsertEmtDto = z.infer<typeof insertEmtSchema>;
export type SelectEmtDto = z.infer<typeof selectEmtSchema>;

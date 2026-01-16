import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { service } from "../schema";

export const insertServiceSchema = createInsertSchema(service).omit({
  id: true,
  createdAt: true,
});

export const selectServiceSchema = createSelectSchema(service);

export type InsertServiceDto = z.infer<typeof insertServiceSchema>;
export type SelectServiceDto = z.infer<typeof selectServiceSchema>;

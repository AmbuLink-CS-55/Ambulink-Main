import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ambulance } from "../schema";

export const insertAmbulanceSchema = createInsertSchema(ambulance).omit({
  id: true,
  createdAt: true,
});

export const selectAmbulanceSchema = createSelectSchema(ambulance);

export type InsertAmbulanceDto = z.infer<typeof insertAmbulanceSchema>;
export type SelectAmbulanceDto = z.infer<typeof selectAmbulanceSchema>;

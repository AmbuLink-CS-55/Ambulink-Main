import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ambulanceride } from "../schema";

export const insertAmbulanceRideSchema = createInsertSchema(ambulanceride).omit(
  {
    id: true,
    createdAt: true,
    completedAt: true,
  }
);

export const selectAmbulanceRideSchema = createSelectSchema(ambulanceride);

export type InsertAmbulanceRideDto = z.infer<typeof insertAmbulanceRideSchema>;
export type SelectAmbulanceRideDto = z.infer<typeof selectAmbulanceRideSchema>;

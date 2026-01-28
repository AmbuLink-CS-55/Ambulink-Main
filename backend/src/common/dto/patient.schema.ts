import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "@/database/schema";

export const insertPatientSchema = createInsertSchema(users)
  .omit({
    id: true,
    role: true,
    providerId: true,
  })
  .extend({
    role: z.literal("PATIENT"),
  });

export const selectPatientSchema = createSelectSchema(users);

export type InsertPatientDto = z.infer<typeof insertPatientSchema>;
export type PatientDto = z.infer<typeof selectPatientSchema>;

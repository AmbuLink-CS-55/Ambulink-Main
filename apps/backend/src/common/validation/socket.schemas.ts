import { z } from "zod";

export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const emergencyContactSchema = z.object({
  id: z.number(),
  number: z.string(),
  name: z.string(),
});

export const patientSettingsSchema = z
  .object({
    profileName: z.string(),
    profileMobile: z.string(),
    profileImage: z.string().nullable(),
    bloodType: z.string(),
    selectedAllergies: z.array(z.string()),
    emergencyContacts: z.array(emergencyContactSchema),
    language: z.string(),
    notifications: z.boolean(),
    darkMode: z.boolean(),
  })
  .passthrough();

export const patientPickupRequestSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    patientSettings: patientSettingsSchema,
  })
  .passthrough();

export const patientCancelRequestSchema = z
  .object({
    reason: z.string().optional(),
  })
  .passthrough();

export const driverLocationPayloadSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

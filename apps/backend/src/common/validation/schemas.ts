import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { ambulance, ambulanceProviders, users } from "@/common/database/schema";

export const createPatientSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  providerId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
});

export const updatePatientSchema = createPatientSchema.partial();

export const createDriverSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
});

export const updateDriverSchema = createDriverSchema.partial();

export const createAmbulanceSchema = createInsertSchema(ambulance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdateTime: true,
  currentLocation: true,
});

export const updateAmbulanceSchema = createAmbulanceSchema.partial();

export const createAmbulanceProviderSchema = createInsertSchema(ambulanceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const updateAmbulanceProviderSchema = createAmbulanceProviderSchema.partial();

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const manualAssignBookingSchema = z.object({
  dispatcherId: z.string().uuid(),
  driverId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  pickupLocation: pointSchema,
  pickupAddress: z.string().nullable().optional(),
  emergencyType: z.string().nullable().optional(),
  patientId: z.string().uuid().optional(),
  patientPhoneNumber: z.string().nullable().optional(),
  patientEmail: z.string().email().nullable().optional(),
});

export const reassignBookingSchema = z
  .object({
    dispatcherId: z.string().uuid(),
    driverId: z.string().uuid().optional(),
    hospitalId: z.string().uuid().optional(),
    pickupLocation: pointSchema.optional(),
    pickupAddress: z.string().nullable().optional(),
  })
  .refine(
    (value) =>
      value.driverId !== undefined ||
      value.hospitalId !== undefined ||
      value.pickupLocation !== undefined ||
      value.pickupAddress !== undefined,
    {
      message:
        "At least one of driverId, hospitalId, pickupLocation or pickupAddress must be provided",
    }
  );

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;

export type CreateDriverDto = z.infer<typeof createDriverSchema>;
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;

export type CreateAmbulanceDto = z.infer<typeof createAmbulanceSchema>;
export type UpdateAmbulanceDto = z.infer<typeof updateAmbulanceSchema>;

export type CreateAmbulanceProviderDto = z.infer<typeof createAmbulanceProviderSchema>;
export type UpdateAmbulanceProviderDto = z.infer<typeof updateAmbulanceProviderSchema>;
export type ManualAssignBookingDto = z.infer<typeof manualAssignBookingSchema>;
export type ReassignBookingDto = z.infer<typeof reassignBookingSchema>;

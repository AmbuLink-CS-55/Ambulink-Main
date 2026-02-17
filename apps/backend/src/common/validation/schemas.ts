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

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;

export type CreateDriverDto = z.infer<typeof createDriverSchema>;
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;

export type CreateAmbulanceDto = z.infer<typeof createAmbulanceSchema>;
export type UpdateAmbulanceDto = z.infer<typeof updateAmbulanceSchema>;

export type CreateAmbulanceProviderDto = z.infer<typeof createAmbulanceProviderSchema>;
export type UpdateAmbulanceProviderDto = z.infer<typeof updateAmbulanceProviderSchema>;

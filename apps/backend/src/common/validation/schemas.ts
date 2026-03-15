import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { ambulance, ambulanceProviders, users } from "@/core/database/schema";

export const createPatientSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  providerId: true,
  isActive: true,
  isDispatcherAdmin: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
  subscribedBookingId: true,
});

export const updatePatientSchema = createPatientSchema.partial();

export const createDriverSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  isActive: true,
  isDispatcherAdmin: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
  subscribedBookingId: true,
});

export const updateDriverSchema = createDriverSchema.partial();

export const createDispatcherSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  isActive: true,
  isDispatcherAdmin: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
  subscribedBookingId: true,
});

export const updateDispatcherSchema = createDispatcherSchema.partial();

export const createEmtSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  isActive: true,
  isDispatcherAdmin: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  currentLocation: true,
  lastLocationUpdate: true,
  status: true,
  subscribedBookingId: true,
});

export const updateEmtSchema = createEmtSchema.partial();

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

export const dispatcherLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const dispatcherSignupSchema = z
  .object({
    fullName: z.string().trim().min(2).max(255),
    phoneNumber: z.string().trim().min(5).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    inviteToken: z.string().trim().min(16).max(256),
  });

export const dispatcherBootstrapSignupSchema = z.object({
  fullName: z.string().trim().min(2).max(255),
  phoneNumber: z.string().trim().min(5).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  providerName: z.string().trim().min(2).max(255),
  providerType: z.enum(["PUBLIC", "PRIVATE"]),
  hotlineNumber: z.string().trim().min(5).max(50).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  initialPrice: z.coerce.number().nonnegative().max(9999999999.99).optional(),
  pricePerKm: z.coerce.number().nonnegative().max(9999999999.99).optional(),
});

export const dispatcherInviteCreateSchema = z.object({
  email: z.string().email(),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(48),
});

export const staffRoleSchema = z.enum(["DISPATCHER", "DRIVER", "EMT"]);

export const staffLoginSchema = z.object({
  role: staffRoleSchema,
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const staffSignupSchema = z
  .object({
    role: staffRoleSchema,
    fullName: z.string().trim().min(2).max(255),
    phoneNumber: z.string().trim().min(5).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    inviteToken: z.string().trim().min(16).max(256),
  });

export const staffInviteCreateSchema = z.object({
  role: staffRoleSchema,
  fullName: z.string().trim().min(2).max(255).optional(),
  phoneNumber: z.string().trim().min(5).max(50).optional(),
  email: z.string().email(),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(48),
});

export const staffInvitePreviewQuerySchema = z.object({
  inviteToken: z.string().trim().min(16).max(256),
});

export const staffInviteActivateSchema = z
  .object({
    inviteToken: z.string().trim().min(16).max(256),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Password and confirmPassword must match",
    path: ["confirmPassword"],
  });

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
    dispatcherId: z.string().uuid().optional(),
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

export const driverNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

export const hospitalNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(50).default(5),
  radiusKm: z.coerce.number().positive().max(200).default(10),
});

export const driverListQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});

export const dispatcherListQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});

export const emtListQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});

export const bookingListQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
});

export const bookingDetailsQuerySchema = z.object({
  dispatcherId: z.string().uuid().optional(),
});

export const analyticsQuerySchema = z
  .object({
    dispatcherId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    bookingId: z.string().uuid().optional(),
  })
  .refine(
    (value) => {
      if (!value.from || !value.to) {
        return true;
      }
      return new Date(value.from).getTime() <= new Date(value.to).getTime();
    },
    {
      message: "`from` must be before or equal to `to`",
      path: ["from"],
    }
  );

export const analyticsAiChatSchema = z.object({
  dispatcherId: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(2000),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const bookingAddNoteSchema = z.object({
  dispatcherId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export const emtBookingSearchQuerySchema = z.object({
  q: z.string().trim().default(""),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const emtSubscribeSchema = z.object({
  bookingId: z.string().uuid(),
});

export const emtAddNoteSchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export const emtAddNoteMediaBodySchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().trim().max(2000).optional(),
  durationMs: z.coerce
    .number()
    .int()
    .positive()
    .max(60 * 60 * 1000)
    .optional(),
});

export const patientUploadSessionStartSchema = z.object({
  patientId: z.string().uuid(),
});

export const patientSessionUploadQuerySchema = z.object({
  patientId: z.string().uuid(),
});

export const patientBookingNoteQuerySchema = z.object({
  patientId: z.string().uuid(),
});

export const patientBookingNoteBodySchema = z.object({
  content: z.string().trim().max(2000).optional(),
  durationMs: z.coerce
    .number()
    .int()
    .positive()
    .max(60 * 60 * 1000)
    .optional(),
});

export const bookingAttachmentAccessQuerySchema = z
  .object({
    patientId: z.string().uuid().optional(),
    dispatcherId: z.string().uuid().optional(),
    emtId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.patientId || value.dispatcherId || value.emtId), {
    message: "One actor id is required",
  });

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;

export type CreateDriverDto = z.infer<typeof createDriverSchema>;
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;
export type CreateDispatcherDto = z.infer<typeof createDispatcherSchema>;
export type UpdateDispatcherDto = z.infer<typeof updateDispatcherSchema>;
export type CreateEmtDto = z.infer<typeof createEmtSchema>;
export type UpdateEmtDto = z.infer<typeof updateEmtSchema>;

export type CreateAmbulanceDto = z.infer<typeof createAmbulanceSchema>;
export type UpdateAmbulanceDto = z.infer<typeof updateAmbulanceSchema>;

export type CreateAmbulanceProviderDto = z.infer<typeof createAmbulanceProviderSchema>;
export type UpdateAmbulanceProviderDto = z.infer<typeof updateAmbulanceProviderSchema>;
export type DispatcherLoginDto = z.infer<typeof dispatcherLoginSchema>;
export type DispatcherSignupDto = z.infer<typeof dispatcherSignupSchema>;
export type DispatcherBootstrapSignupDto = z.infer<typeof dispatcherBootstrapSignupSchema>;
export type DispatcherInviteCreateDto = z.infer<typeof dispatcherInviteCreateSchema>;
export type StaffRoleDto = z.infer<typeof staffRoleSchema>;
export type StaffLoginDto = z.infer<typeof staffLoginSchema>;
export type StaffSignupDto = z.infer<typeof staffSignupSchema>;
export type StaffInviteCreateDto = z.infer<typeof staffInviteCreateSchema>;
export type StaffInvitePreviewQueryDto = z.infer<typeof staffInvitePreviewQuerySchema>;
export type StaffInviteActivateDto = z.infer<typeof staffInviteActivateSchema>;
export type ManualAssignBookingDto = z.infer<typeof manualAssignBookingSchema>;
export type ReassignBookingDto = z.infer<typeof reassignBookingSchema>;
export type DriverNearbyQueryDto = z.infer<typeof driverNearbyQuerySchema>;
export type HospitalNearbyQueryDto = z.infer<typeof hospitalNearbyQuerySchema>;
export type DriverListQueryDto = z.infer<typeof driverListQuerySchema>;
export type DispatcherListQueryDto = z.infer<typeof dispatcherListQuerySchema>;
export type EmtListQueryDto = z.infer<typeof emtListQuerySchema>;
export type BookingListQueryDto = z.infer<typeof bookingListQuerySchema>;
export type BookingDetailsQueryDto = z.infer<typeof bookingDetailsQuerySchema>;
export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsAiChatDto = z.infer<typeof analyticsAiChatSchema>;
export type BookingAddNoteDto = z.infer<typeof bookingAddNoteSchema>;
export type EmtBookingSearchQueryDto = z.infer<typeof emtBookingSearchQuerySchema>;
export type EmtSubscribeDto = z.infer<typeof emtSubscribeSchema>;
export type EmtAddNoteDto = z.infer<typeof emtAddNoteSchema>;
export type EmtAddNoteMediaBodyDto = z.infer<typeof emtAddNoteMediaBodySchema>;
export type PatientUploadSessionStartDto = z.infer<typeof patientUploadSessionStartSchema>;
export type PatientSessionUploadQueryDto = z.infer<typeof patientSessionUploadQuerySchema>;
export type PatientBookingNoteQueryDto = z.infer<typeof patientBookingNoteQuerySchema>;
export type PatientBookingNoteBodyDto = z.infer<typeof patientBookingNoteBodySchema>;
export type BookingAttachmentAccessQueryDto = z.infer<typeof bookingAttachmentAccessQuerySchema>;

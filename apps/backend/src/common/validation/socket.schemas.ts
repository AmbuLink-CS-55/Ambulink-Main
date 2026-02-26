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

export const driverEventDriverIdSchema = z
  .object({
    driverId: z.string().uuid(),
  })
  .passthrough();

export const patientEventPatientIdSchema = z
  .object({
    patientId: z.string().uuid(),
  })
  .passthrough();

export const patientHelpCommandSchema = patientEventPatientIdSchema.merge(patientPickupRequestSchema);
export const patientCancelCommandSchema = patientEventPatientIdSchema.merge(patientCancelRequestSchema);
export const driverLocationCommandSchema = driverEventDriverIdSchema.merge(driverLocationPayloadSchema);
export const driverShiftCommandSchema = driverEventDriverIdSchema.merge(
  z.object({
    onShift: z.boolean(),
  })
);

const locationSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .nullable();

export const bookingAssignedPayloadSchema = z
  .object({
    bookingId: z.string().nullable(),
    status: z.enum(["ASSIGNED", "ARRIVED", "PICKEDUP"]),
    pickupLocation: locationSchema,
    patient: z
      .object({
        id: z.string(),
        fullName: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
      })
      .passthrough(),
    driver: z
      .object({
        id: z.string(),
        fullName: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
        provider: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .nullable(),
      })
      .passthrough(),
    hospital: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
      })
      .passthrough(),
    provider: z
      .object({
        id: z.string(),
        name: z.string(),
        hotlineNumber: z.string().nullable(),
      })
      .nullable(),
  })
  .passthrough();

export const dispatcherBookingPayloadSchema = z
  .object({
    bookingId: z.string(),
    requestId: z.string().optional(),
    status: z.enum(["ASSIGNED", "ARRIVED", "PICKEDUP", "COMPLETED", "CANCELLED"]),
    pickupLocation: locationSchema,
    patient: z
      .object({
        id: z.string(),
        fullName: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
      })
      .passthrough(),
    driver: z
      .object({
        id: z.string(),
        fullName: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
        provider: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .nullable(),
      })
      .passthrough(),
    hospital: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
        phoneNumber: z.string().nullable(),
        location: locationSchema,
      })
      .passthrough(),
    provider: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
  })
  .passthrough();

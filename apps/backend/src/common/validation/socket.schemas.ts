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

export const dispatcherDecisionSubmitPayloadSchema = z
  .object({
    requestId: z.string().trim().min(1),
    approved: z.boolean(),
  })
  .passthrough();

export const emtSubscribePayloadSchema = z
  .object({
    bookingId: z.string().uuid(),
  })
  .passthrough();

export const emtAddNotePayloadSchema = z
  .object({
    bookingId: z.string().uuid(),
    content: z.string().trim().min(1).max(2000),
  })
  .passthrough();

export const driverEventDriverIdSchema = z
  .object({
    driverId: z.string().uuid(),
  })
  .passthrough();

export const emtEventEmtIdSchema = z
  .object({
    emtId: z.string().uuid(),
  })
  .passthrough();

export const patientEventPatientIdSchema = z
  .object({
    patientId: z.string().uuid(),
  })
  .passthrough();

export const patientHelpCommandSchema = patientEventPatientIdSchema.merge(
  patientPickupRequestSchema
);
export const patientCancelCommandSchema = patientEventPatientIdSchema.merge(
  patientCancelRequestSchema
);
export const driverLocationCommandSchema = driverEventDriverIdSchema.merge(
  driverLocationPayloadSchema
);
export const driverShiftCommandSchema = driverEventDriverIdSchema.merge(
  z.object({
    onShift: z.boolean(),
  })
);
export const emtSubscribeCommandSchema = emtEventEmtIdSchema.merge(emtSubscribePayloadSchema);
export const emtAddNoteCommandSchema = emtEventEmtIdSchema.merge(emtAddNotePayloadSchema);

export const patientHelpHttpBodySchema = patientPickupRequestSchema;
export const patientCancelHttpBodySchema = patientCancelRequestSchema;
export const driverLocationHttpBodySchema = driverLocationPayloadSchema;
export const driverShiftHttpBodySchema = z.object({
  onShift: z.boolean(),
});
export const emtSubscribeHttpBodySchema = emtSubscribePayloadSchema;
export const emtAddNoteHttpBodySchema = emtAddNotePayloadSchema;

const locationSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .nullable();

const emtNoteSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  authorId: z.string(),
  authorName: z.string().nullable().optional(),
  authorRole: z.enum(["EMT", "DISPATCHER"]),
  content: z.string(),
  createdAt: z.string(),
});

export const bookingAssignedPayloadSchema = z
  .object({
    bookingId: z.string().nullable(),
    status: z.enum(["ASSIGNED", "ARRIVED", "PICKEDUP"]),
    requestedAt: z.string().nullable(),
    assignedAt: z.string().nullable(),
    arrivedAt: z.string().nullable(),
    pickedupAt: z.string().nullable(),
    completedAt: z.string().nullable(),
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
    patientProfileSnapshot: patientSettingsSchema.nullable().optional(),
    emtNotes: z.array(emtNoteSchema).optional(),
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

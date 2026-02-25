import type { BookingStatus } from "@/common/database/schema";
import type { DispatcherBookingPayload } from "@ambulink/types";
import {
  bookingAssignedPayloadSchema,
  dispatcherBookingPayloadSchema,
} from "@/common/validation/socket.schemas";

type AssignedBookingRow = {
  bookingId: string;
  status: BookingStatus;
  pickupLocationX: number | null;
  pickupLocationY: number | null;
  patientId: string;
  patientName: string | null;
  patientPhone: string | null;
  patientLocationX: number | null;
  patientLocationY: number | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverLocationX: number | null;
  driverLocationY: number | null;
  providerId: string | null;
  providerName: string | null;
  providerHotline: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  hospitalPhone: string | null;
  hospitalLocationX: number | null;
  hospitalLocationY: number | null;
};

type DispatcherBookingRow = {
  bookingId: string;
  status: BookingStatus;
  pickupLocationX: number | null;
  pickupLocationY: number | null;
  patientId: string;
  patientName: string | null;
  patientPhone: string | null;
  patientLocationX: number | null;
  patientLocationY: number | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverLocationX: number | null;
  driverLocationY: number | null;
  providerId: string | null;
  providerName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  hospitalPhone: string | null;
  hospitalLocationX: number | null;
  hospitalLocationY: number | null;
};

export const mapAssignedBookingPayload = (row: AssignedBookingRow | null) => {
  if (!row || !row.driverId || !row.hospitalId) {
    return null;
  }

  const pickupLocation =
    row.pickupLocationX !== null && row.pickupLocationY !== null
      ? { x: row.pickupLocationX, y: row.pickupLocationY }
      : null;
  const patientLocation =
    row.patientLocationX !== null && row.patientLocationY !== null
      ? { x: row.patientLocationX, y: row.patientLocationY }
      : null;
  const driverLocation =
    row.driverLocationX !== null && row.driverLocationY !== null
      ? { x: row.driverLocationX, y: row.driverLocationY }
      : null;
  const hospitalLocation =
    row.hospitalLocationX !== null && row.hospitalLocationY !== null
      ? { x: row.hospitalLocationX, y: row.hospitalLocationY }
      : null;

  const payload = {
    bookingId: row.bookingId,
    status: row.status === "REQUESTED" ? "ASSIGNED" : row.status,
    pickupLocation,
    patient: {
      id: row.patientId,
      fullName: row.patientName ?? null,
      phoneNumber: row.patientPhone ?? null,
      location: patientLocation,
    },
    driver: {
      id: row.driverId,
      fullName: row.driverName ?? null,
      phoneNumber: row.driverPhone ?? null,
      location: driverLocation,
      provider:
        row.providerId && row.providerName ? { id: row.providerId, name: row.providerName } : null,
    },
    hospital: {
      id: row.hospitalId,
      name: row.hospitalName ?? null,
      phoneNumber: row.hospitalPhone ?? null,
      location: hospitalLocation,
    },
    provider:
      row.providerId && row.providerName
        ? {
            id: row.providerId,
            name: row.providerName,
            hotlineNumber: row.providerHotline ?? null,
          }
        : null,
  };

  const parsed = bookingAssignedPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[booking] invalid assigned payload", parsed.error.flatten());
    return null;
  }

  return parsed.data;
};

export const mapDispatcherBookingPayload = (
  row: DispatcherBookingRow | null,
  requestId?: string
): DispatcherBookingPayload | null => {
  if (!row || !row.driverId || !row.hospitalId) {
    return null;
  }

  const status = row.status === "REQUESTED" ? "ASSIGNED" : row.status;
  const pickupLocation =
    row.pickupLocationX !== null && row.pickupLocationY !== null
      ? { x: row.pickupLocationX, y: row.pickupLocationY }
      : null;
  const patientLocation =
    row.patientLocationX !== null && row.patientLocationY !== null
      ? { x: row.patientLocationX, y: row.patientLocationY }
      : null;
  const driverLocation =
    row.driverLocationX !== null && row.driverLocationY !== null
      ? { x: row.driverLocationX, y: row.driverLocationY }
      : null;
  const hospitalLocation =
    row.hospitalLocationX !== null && row.hospitalLocationY !== null
      ? { x: row.hospitalLocationX, y: row.hospitalLocationY }
      : null;

  const payload = {
    bookingId: row.bookingId,
    requestId,
    status,
    pickupLocation,
    patient: {
      id: row.patientId,
      fullName: row.patientName ?? null,
      phoneNumber: row.patientPhone ?? null,
      location: patientLocation,
    },
    driver: {
      id: row.driverId,
      fullName: row.driverName ?? null,
      phoneNumber: row.driverPhone ?? null,
      location: driverLocation,
      provider:
        row.providerId && row.providerName ? { id: row.providerId, name: row.providerName } : null,
    },
    hospital: {
      id: row.hospitalId,
      name: row.hospitalName ?? null,
      phoneNumber: row.hospitalPhone ?? null,
      location: hospitalLocation,
    },
    provider:
      row.providerId && row.providerName ? { id: row.providerId, name: row.providerName } : null,
  } satisfies DispatcherBookingPayload;

  const parsed = dispatcherBookingPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[booking] invalid dispatcher payload", parsed.error.flatten());
    return null;
  }

  return parsed.data;
};

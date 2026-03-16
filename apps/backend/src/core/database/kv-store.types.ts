import type { Booking, UserStatus } from "@/core/database/schema";
import type { BookingNote, PatientSettingsData, Point } from "@ambulink/types";

export const KV_STORE = Symbol("KV_STORE");

export type CreateBookingValues = {
  patientId: string;
  pickupAddress: string | null;
  pickupLocation: Point;
  providerId: string | null;
  driverId: string;
  hospitalId: string;
  dispatcherId?: string | null;
  emergencyType: string | null;
  fareEstimate?: string | null;
  patientProfileSnapshot?: PatientSettingsData | null;
};

export type DriverState = {
  status?: UserStatus | null;
  location?: Point | null;
  lastLocationUpdate?: Date | null;
  updatedAt?: Date;
  dirty: boolean;
};

export type BookingState = {
  id: string;
  isNew: boolean;
  dirty: boolean;
  data: Partial<Booking> & { id: string };
};

/**
 * Strips unknown/unsafe fields from a booking patch, keeping only
 * the fields that the KV layer is allowed to cache.
 */
export function sanitizeBookingPatch(patch: Partial<Booking>): Partial<Booking> {
  const allowed: Partial<Booking> = {};
  if (patch.id !== undefined) allowed.id = patch.id;
  if (patch.patientId !== undefined) allowed.patientId = patch.patientId;
  if (patch.driverId !== undefined) allowed.driverId = patch.driverId;
  if (patch.dispatcherId !== undefined) allowed.dispatcherId = patch.dispatcherId;
  if (patch.emtId !== undefined) allowed.emtId = patch.emtId;
  if (patch.status !== undefined) allowed.status = patch.status;
  if (patch.ongoing !== undefined) allowed.ongoing = patch.ongoing;
  if (patch.requestedAt !== undefined) allowed.requestedAt = patch.requestedAt;
  if (patch.assignedAt !== undefined) allowed.assignedAt = patch.assignedAt;
  if (patch.arrivedAt !== undefined) allowed.arrivedAt = patch.arrivedAt;
  if (patch.pickedupAt !== undefined) allowed.pickedupAt = patch.pickedupAt;
  if (patch.completedAt !== undefined) allowed.completedAt = patch.completedAt;
  return allowed;
}

export interface KvStore {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  createBooking(values: CreateBookingValues): Promise<Booking>;
  updateBooking(bookingId: string, patch: Partial<Booking>): Promise<void>;
  appendBookingNote(bookingId: string, note: BookingNote): Promise<void>;
  getBookingState(bookingId: string): Promise<BookingState | undefined>;
  getBookingData(bookingId: string): Promise<(Partial<Booking> & { id: string }) | undefined>;
  getActiveBookingByIdFromMemory(
    bookingId: string
  ): Promise<(Partial<Booking> & { id: string }) | null>;
  getNewActiveBookingsByPatient(patientId: string): Promise<Array<Partial<Booking> & { id: string }>>;
  getNewActiveBookingsByDriver(driverId: string): Promise<Array<Partial<Booking> & { id: string }>>;
  getNewActiveBookingsByDispatcher(
    dispatcherId: string
  ): Promise<Array<Partial<Booking> & { id: string }>>;
  getNewOngoingDispatchBookingByDriver(driverId: string): Promise<{
    bookingId: string;
    patientId: string | null;
    dispatcherId: string | null;
  } | null>;
  applyBookingOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]>;
  setDriverState(driverId: string, patch: Omit<DriverState, "dirty">): Promise<void>;
  getDriverState(driverId: string): Promise<DriverState | undefined>;
  applyDriverOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]>;
  setUserSubscribedBooking(userId: string, bookingId: string | null): Promise<void>;
  clearSubscriptionsForBooking(bookingId: string): Promise<string[]>;
  getUserSubscribedBooking(userId: string): Promise<string | null | undefined>;
  hasUserSubscribedBookingOverride(userId: string): Promise<boolean>;
  flushToPostgres(): Promise<void>;
}

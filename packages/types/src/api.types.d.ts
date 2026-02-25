import type { BookingStatus } from "./database.types";
import type { Point } from "./common.types";
import type { PatientSettingsData } from "./socket.types";

export type NearbyDriver = {
  id: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  providerId?: string | null;
  status?: string | null;
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export type NearbyHospital = {
  id: string;
  name: string;
  hospitalType: string;
  address: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export type BookingLogEntry = {
  bookingId: string;
  status: BookingStatus;
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
  updatedAt?: string | null;
  fareEstimate: string | null;
  fareFinal: string | null;
  cancellationReason: string | null;
  patientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  ambulanceId: string | null;
  providerId: string | null;
  providerName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
};

export type DriverLocationCommand = {
  driverId: string;
  x: number;
  y: number;
};

export type DriverCommand = {
  driverId: string;
};

export type PatientHelpCommand = {
  patientId: string;
  x: number;
  y: number;
  patientSettings: PatientSettingsData;
};

export type PatientCancelCommand = {
  patientId: string;
  reason?: string;
};

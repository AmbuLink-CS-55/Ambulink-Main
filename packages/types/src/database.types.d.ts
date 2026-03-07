import { Point } from "./common.types";
export type UserRole = "PATIENT" | "DISPATCHER" | "DRIVER" | "EMT";
export type UserStatus = "AVAILABLE" | "BUSY" | "OFFLINE";
export type ProviderType = "PUBLIC" | "PRIVATE";
export type AmbulanceStatus = "AVAILABLE" | "BUSY" | "OFFLINE";
export type BookingStatus =
  | "REQUESTED"
  | "ASSIGNED"
  | "ARRIVED"
  | "PICKEDUP"
  | "COMPLETED"
  | "CANCELLED";
export interface AmbulanceProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string;
  pricePerKm?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface NewAmbulanceProvider {
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string;
  pricePerKm?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface User {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLoginAt?: string;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: string;
  status?: UserStatus;
  subscribedBookingId?: string;
}
export interface NewUser {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: string;
  status?: UserStatus;
  subscribedBookingId?: string;
}
export interface Ambulance {
  id: string;
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status: AmbulanceStatus;
  createdAt: string;
  updatedAt: string;
  lastUpdateTime?: string;
  currentLocation?: Point;
}
export interface NewAmbulance {
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status?: AmbulanceStatus;
  createdAt?: string;
  updatedAt?: string;
  lastUpdateTime?: string;
  currentLocation?: Point;
}
export interface Hospital {
  id: string;
  name: string;
  hospitalType: string;
  address?: string;
  phoneNumber?: string;
  location?: Point;
  isActive: boolean;
}
export interface NewHospital {
  name: string;
  hospitalType: string;
  address?: string;
  phoneNumber?: string;
  location?: Point;
  isActive?: boolean;
}
export interface Helpline {
  id: string;
  name: string;
  phoneNumber: string;
  description?: string;
  isActive: boolean;
}
export interface NewHelpline {
  name: string;
  phoneNumber: string;
  description?: string;
  isActive?: boolean;
}
export interface Booking {
  id: string;
  patientId?: string;
  pickupAddress?: string;
  pickupLocation?: Point;
  status: BookingStatus;
  ongoing: boolean;
  providerId?: string;
  ambulanceId?: string;
  driverId?: string;
  emtId?: string;
  dispatcherId?: string;
  hospitalId?: string;
  emergencyType?: string;
  patientProfileSnapshot?: Record<string, unknown> | null;
  emtNotes?: Array<Record<string, unknown>>;
  requestedAt: string;
  assignedAt?: string;
  pickedupAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  fareEstimate?: string;
  fareFinal?: string;
  cancellationReason?: string;
}
export interface NewBooking {
  patientId?: string;
  pickupAddress?: string;
  pickupLocation?: Point;
  status?: BookingStatus;
  providerId?: string;
  ambulanceId?: string;
  driverId?: string;
  emtId?: string;
  dispatcherId?: string;
  hospitalId?: string;
  emergencyType?: string;
  patientProfileSnapshot?: Record<string, unknown> | null;
  emtNotes?: Array<Record<string, unknown>>;
  requestedAt?: string;
  assignedAt?: string;
  pickedupAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  fareEstimate?: string;
  fareFinal?: string;
  cancellationReason?: string;
}

// Auto-generated from backend schema - do not edit manually
// Generated: 2026-02-11T17:33:36.847Z
// Source: apps/backend/src/common/database/schema.ts
// Command: npm run generate:types

import { Point } from './common.types';

// ============================================================================
// Enum Types
// ============================================================================

export type UserRole = 'PATIENT' | 'DISPATCHER' | 'DRIVER' | 'EMT';
export type UserStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type ProviderType = 'PUBLIC' | 'PRIVATE';
export type AmbulanceStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type BookingStatus = 'REQUESTED' | 'ASSIGNED' | 'ARRIVED' | 'PICKEDUP' | 'COMPLETED' | 'CANCELLED';

// ============================================================================
// Table Types
// ============================================================================

export interface AmbulanceProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string; // Decimal as string to avoid precision loss
  pricePerKm?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAmbulanceProvider {
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string;
  pricePerKm?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: Date;
  status?: UserStatus;
}

export interface NewUser {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  lastLoginAt?: Date;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: Date;
  status?: UserStatus;
}

export interface Ambulance {
  id: string;
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status: AmbulanceStatus;
  createdAt: Date;
  updatedAt: Date;
  lastUpdateTime?: Date;
  currentLocation?: Point;
}

export interface NewAmbulance {
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status?: AmbulanceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  lastUpdateTime?: Date;
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
  providerId?: string;
  ambulanceId?: string;
  driverId?: string;
  emtId?: string;
  dispatcherId?: string;
  hospitalId?: string;
  emergencyType?: string;
  requestedAt: Date;
  assignedAt?: Date;
  pickedupAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  fareEstimate?: string; // Decimal as string to avoid precision loss
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
  requestedAt?: Date;
  assignedAt?: Date;
  pickedupAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  fareEstimate?: string;
  fareFinal?: string;
  cancellationReason?: string;
}

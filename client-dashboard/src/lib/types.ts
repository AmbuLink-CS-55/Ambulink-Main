// Enums
const UserRole = {
  PATIENT: "PATIENT",
  DISPATCHER: "DISPATCHER",
  DRIVER: "DRIVER",
  EMT: "EMT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

const UserStatus = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

const ProviderType = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;

export type ProviderType = (typeof ProviderType)[keyof typeof ProviderType];

const AmbulanceStatus = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
} as const;

export type AmbulanceStatus = (typeof AmbulanceStatus)[keyof typeof AmbulanceStatus];

const BookingStatus = {
  REQUESTED: "REQUESTED",
  ASSIGNED: "ASSIGNED",
  ARRIVED: "ARRIVED",
  PICKEDUP: "PICKEDUP",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

// Geometry Type
export interface Point {
  lat: number;
  lng: number;
}

// Table Types
export interface AmbulanceProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string; // decimal type in DB, use string to avoid precision issues
  pricePerKm?: string; // decimal type in DB, use string to avoid precision issues
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  providerId?: string; // FK
  currentLocation?: Point;
  lastLocationUpdate?: Date;
  status?: UserStatus;
}

export interface Ambulance {
  id: string;
  providerId: string; // FK
  vehicleNumber: string;
  equipmentLevel?: string;
  status: AmbulanceStatus;
  createdAt: Date;
  updatedAt: Date;
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

export interface Helpline {
  id: string;
  name: string;
  phoneNumber: string;
  description?: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  patientId?: string; // FK
  pickupAddress?: string;
  pickupLocation?: Point;
  status: BookingStatus;
  providerId?: string; // FK
  ambulanceId?: string; // FK
  driverId?: string; // FK
  hospitalId?: string; // FK
  emergencyType?: string;
  requestedAt: Date;
  assignedAt?: Date;
  pickedupAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  fareEstimate?: string; // decimal type in DB
  fareFinal?: string; // decimal type in DB
  cancellationReason?: string;
}

// WebSocket Types

// Requests from Patient
export interface PatientPickupRequest {
  lat: number;
  lng: number;
}

// Requests from Driver
export interface DriverLocationUpdate {
  id: string; // Driver ID
  latitude: number;
  longitude: number;
}

// Responses to Patient/Driver (common booking event payload)
export interface BookingEventPayload {
  bookingId: string;
}

// Patient to Server
export type PatientToServerEvents = {
  "patient:help": PatientPickupRequest;
  "patient:cancelled": PatientPickupRequest; // Data is not directly used for cancellation logic, but still sent
};

// Driver to Server
export type DriverToServerEvents = {
  "driver:update": DriverLocationUpdate;
  "driver:arrived": undefined; // No direct payload from client
  "driver:completed": undefined; // No direct payload from client
};

// Server to Patient
export type ServerToPatientEvents = {
  "booking:assigned": Booking;
  "booking:arrived": BookingEventPayload;
  "booking:completed": BookingEventPayload;
};

// Server to Driver
export type ServerToDriverEvents = {
  "booking:assigned": Booking; // Already defined in ServerToPatientEvents
  "booking:cancelled": Booking;
};

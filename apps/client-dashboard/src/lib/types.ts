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
  x: number;
  y: number;
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
  patientId: string;
  lat: number;
  lng: number;
}

// Patient cancellation request
export interface PatientCancelRequest {
  reason?: string;
}

// Requests from Driver
export interface DriverLocationUpdate {
  id: string; // Driver ID
  x: number;
  y: number;
}

// Responses to Patient/Driver (common booking event payload)
export interface BookingEventPayload {
  bookingId: string;
}

// Error payload
export interface ErrorPayload {
  message: string;
}

// Booking failed payload
export interface BookingFailedPayload {
  reason: "no_drivers" | "no_dispatchers" | "all_rejected" | "error";
}

// Booking cancellation payload
export interface BookingCancelledPayload {
  bookingId: string;
  reason: string;
}

// ============================================================================
// Detailed Booking Structures (from backend)
// ============================================================================

/**
 * Complete booking assignment payload sent when a booking is created
 */
export interface BookingAssignedPayload {
  bookingId: string | null;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: Point | null;
  };
  driver: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: Point | null;
    provider: {
      id: string;
      name: string;
    } | null;
  };
  hospital: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    location: Point | null;
  };
  provider: {
    id: string;
    name: string;
  } | null;
}

/**
 * Nearby driver information
 */
export interface NearByDriver {
  id: string;
  phoneNumber: string | null;
  lat: number;
  lng: number;
  ambulance_provider: {
    id: string;
    name: string;
  };
  distance: number;
}

/**
 * Booking request payload sent to dispatchers for approval
 */
export interface BookingNewPayload {
  requestId: string;
  driver: {
    id: string;
    providerId?: string | null;
    currentLocation?: Point | null;
    lat?: number;
    lng?: number;
    ambulance_provider?: {
      id: string;
      name: string;
    };
  };
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    currentLocation?: Point | null;
    lat?: number;
    lng?: number;
    [key: string]: any; // Other patient fields
  };
}

/**
 * Dispatcher approval response
 */
export interface DispatcherApprovalResponse {
  approved: boolean;
}

export interface BookingDecisionPayload {
  requestId: string;
  isWinner: boolean;
  winner: {
    id: string;
    name: string | null;
    providerName: string | null;
  };
}

export interface DispatcherBookingPayload {
  bookingId: string;
  requestId?: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  pickupLocation: Point | null;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: Point | null;
  };
  driver: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: Point | null;
    provider: {
      id: string;
      name: string;
    } | null;
  };
  hospital: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    location: Point | null;
  };
  provider: {
    id: string;
    name: string;
  } | null;
}

export interface DispatcherBookingUpdatePayload {
  bookingId: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  updatedAt: string;
}

export interface DispatcherBookingLogPayload {
  providerId: string;
  bookingId: string;
  status: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  updatedAt: string;
}

// ============================================================================
// Socket Event Type Definitions
// ============================================================================

// Patient to Server
export type PatientToServerEvents = {
  "patient:help": (data: PatientPickupRequest) => void;
  "patient:cancelled": (data: PatientCancelRequest) => void;
};

// Server to Patient
export type ServerToPatientEvents = {
  "booking:failed": (data: BookingFailedPayload) => void;
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:arrived": (data: BookingEventPayload) => void;
  "booking:completed": (data: BookingEventPayload) => void;
  "booking:cancelled": (data: { bookingId: string; message: string }) => void;
  "booking:cancel:error": (data: ErrorPayload) => void;
};

// Driver to Server
export type DriverToServerEvents = {
  "driver:update": (data: DriverLocationUpdate) => void;
  "driver:arrived": () => void;
  "driver:completed": () => void;
};

// Server to Driver
export type ServerToDriverEvents = {
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:cancelled": (data: BookingCancelledPayload) => void;
};

// Dispatcher to Server (none currently - uses callbacks)
export type DispatcherToServerEvents = Record<string, never>;

// Server to Dispatcher
export type ServerToDispatcherEvents = {
  "booking:new": (
    data: BookingNewPayload,
    callback: (response: DispatcherApprovalResponse) => void
  ) => void;
  "booking:assigned": (data: DispatcherBookingPayload) => void;
  "booking:sync": (data: { bookings: DispatcherBookingPayload[] }) => void;
  "booking:update": (data: DispatcherBookingUpdatePayload) => void;
  "booking:decision": (data: BookingDecisionPayload) => void;
  "booking:log": (data: DispatcherBookingLogPayload) => void;
  "driver:update": (data: DriverLocationUpdate) => void;
};

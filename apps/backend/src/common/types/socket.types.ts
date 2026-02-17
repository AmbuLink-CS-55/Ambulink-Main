import { User } from "@/common/database/schema";

export type BloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "";
export type Allergie =
  | "Peanuts"
  | "Tree nuts"
  | "Shellfish"
  | "Fish"
  | "Eggs"
  | "Milk"
  | "Soy"
  | "Wheat"
  | "Sesame"
  | "Sulfites"
  | "Penicillin"
  | "Aspirin"
  | "Ibuprofen"
  | "Latex"
  | "";
export type EmergencyContact = {
  id: number;
  number: string;
  name: string;
};
export type PatientSettingsData = {
  profileName: string;
  profileMobile: string;
  profileImage: string | null;
  bloodType: BloodType;
  selectedAllergies: Allergie[];
  emergencyContacts: EmergencyContact[];
  language: string;
  notifications: boolean;
  darkMode: boolean;
};

export type PatientPickupRequest = {
  x: number;
  y: number;
  patientSettings: PatientSettingsData;
};

/**
 * Driver location update data
 */
export type DriverLocationUpdate = {
  id: string;
  x: number;
  y: number;
};

export type LocationPoint = {
  x: number;
  y: number;
};

/**
 * Basic booking event payload with just the booking ID
 */
export type BookingEventPayload = {
  bookingId: string;
};

/**
 * Booking cancellation payload
 */
export type BookingCancelledPayload = {
  bookingId: string;
  reason: string;
};

/**
 * Patient cancellation request
 */
export type PatientCancelRequest = {
  reason?: string;
};

/**
 * Error payload
 */
export type ErrorPayload = {
  message: string;
};

// ============================================================================
// Detailed Booking Structures (from booking.service.ts createBooking response)
// ============================================================================

/**
 * Complete booking assignment payload sent when a booking is created
 * Structure matches the response from booking.service.ts createBooking method
 */
export type BookingAssignedPayload = {
  id: string;
  patient: {
    id: string;
    phone_number: string;
    name: string;
    lat: number;
    lng: number;
  };
  driver: {
    id: string;
    phone_number: string;
    lat: number;
    lng: number;
    ambulance_provider: {
      id: string;
      name: string;
    };
  };
  hospital: {
    id: string;
    name: string;
    phone_number: string;
    lat: number;
    lng: number;
  };
  dispatcherId?: string | null;
  provider?: {
    id: string;
    name: string;
  } | null;
};

export type DispatcherBookingPayload = {
  bookingId: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  pickupLocation: LocationPoint | null;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: LocationPoint | null;
  };
  driver: {
    id: string | null;
    fullName: string | null;
    phoneNumber: string | null;
    location: LocationPoint | null;
    provider: {
      id: string;
      name: string;
    } | null;
  };
  hospital: {
    id: string | null;
    name: string | null;
    phoneNumber: string | null;
    location: LocationPoint | null;
  };
  provider: {
    id: string;
    name: string;
  } | null;
};

export type DispatcherBookingUpdatePayload = {
  bookingId: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  updatedAt: string;
};

/**
 * Booking request payload sent to dispatchers for approval
 * Used in booking:new event with callback acknowledgment
 */
export type BookingNewPayload = {
  requestId: string;
  driver: {
    id: string;
    providerId?: string | null;
    currentLocation?: { x: number; y: number } | null;
  };
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    currentLocation?: { x: number; y: number } | null;
    [key: string]: any; // Other patient fields from SelectPatientDto
  };
};

/**
 * Dispatcher approval response
 */
export type DispatcherApprovalResponse = {
  approved: boolean;
};

// ============================================================================
// Socket Event Type Definitions
// ============================================================================

/**
 * Events that patients can send to the server
 */
export interface PatientToServerEvents {
  "patient:help": (data: PatientPickupRequest) => void;
  "patient:cancelled": (data: PatientCancelRequest) => void;
}

/**
 * Events that the server can send to patients
 */
export interface ServerToPatientEvents {
  die: () => void; // No dispatchers available
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:arrived": (data: BookingEventPayload) => void;
  "booking:completed": (data: BookingEventPayload) => void;
  "booking:cancelled": (data: { bookingId: string; message: string }) => void;
  "booking:cancel:error": (data: ErrorPayload) => void;
}

/**
 * Events that drivers can send to the server
 */
export interface DriverToServerEvents {
  "driver:update": (data: DriverLocationUpdate) => void;
  "driver:arrived": () => void;
  "driver:completed": () => void;
}

/**
 * Events that the server can send to drivers
 */
export interface ServerToDriverEvents {
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:cancelled": (data: BookingCancelledPayload) => void;
}

/**
 * Events that dispatchers can send to the server
 * Currently none - dispatchers respond via acknowledgment callbacks
 */
export type DispatcherToServerEvents = Record<string, never>;

/**
 * Events that the server can send to dispatchers
 */
export interface ServerToDispatcherEvents {
  "booking:new": (
    data: BookingNewPayload,
    callback: (response: DispatcherApprovalResponse) => void
  ) => void;
  "booking:assigned": (data: DispatcherBookingPayload) => void;
  "booking:sync": (data: { bookings: DispatcherBookingPayload[] }) => void;
  "booking:update": (data: DispatcherBookingUpdatePayload) => void;
  "booking:decision": (data: {
    requestId: string;
    isWinner: boolean;
    winner: {
      id: string;
      name: string | null;
      providerName: string | null;
    };
  }) => void;
  "driver:update": (data: DriverLocationUpdate) => void;
}

/**
 * Shared Socket.IO Event Type Definitions
 * 
 * This file contains all socket event types used across the application.
 * These types are shared between backend and frontend to ensure type safety.
 */

import { NearByDriver } from "./index";

// ============================================================================
// Common Payloads
// ============================================================================

/**
 * Patient pickup request data
 */
export interface PatientPickupRequest {
  patientId: string;
  lat: number;
  lng: number;
}

/**
 * Driver location update data
 */
export interface DriverLocationUpdate {
  id: string;
  latitude: number;
  longitude: number;
}

/**
 * Basic booking event payload with just the booking ID
 */
export interface BookingEventPayload {
  bookingId: string;
}

/**
 * Booking cancellation payload
 */
export interface BookingCancelledPayload {
  bookingId: string;
  reason: string;
}

/**
 * Patient cancellation request
 */
export interface PatientCancelRequest {
  reason?: string;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  message: string;
}

// ============================================================================
// Detailed Booking Structures (from booking.service.ts createBooking response)
// ============================================================================

/**
 * Complete booking assignment payload sent when a booking is created
 * Structure matches the response from booking.service.ts createBooking method
 */
export interface BookingAssignedPayload {
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
}

/**
 * Booking request payload sent to dispatchers for approval
 * Used in booking:new event with callback acknowledgment
 */
export interface BookingNewPayload {
  requestId: string;
  driver: NearByDriver;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    [key: string]: any; // Other patient fields from SelectPatientDto
  };
}

/**
 * Dispatcher approval response
 */
export interface DispatcherApprovalResponse {
  approved: boolean;
}

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
export interface DispatcherToServerEvents {
  // Empty - dispatchers use acknowledgment callbacks instead of emit
}

/**
 * Events that the server can send to dispatchers
 */
export interface ServerToDispatcherEvents {
  "booking:new": (
    data: BookingNewPayload,
    callback: (response: DispatcherApprovalResponse) => void
  ) => void;
  "booking:assigned": (data: BookingAssignedPayload) => void;
}

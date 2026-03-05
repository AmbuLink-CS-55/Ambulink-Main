export type PatientSettingsData = {
  profileName: string;
  profileMobile: string;
  profileImage: string | null;
  bloodType: string;
  selectedAllergies: string[];
  emergencyContacts: Array<{
    id: number;
    number: string;
    name: string;
  }>;
  language: string;
  notifications: boolean;
  darkMode: boolean;
};
export type PatientPickupRequest = {
  x: number;
  y: number;
  patientSettings: PatientSettingsData;
};
export type DriverLocationPayload = {
  x: number;
  y: number;
};
export type BookingNote = {
  id: string;
  bookingId: string;
  authorId: string;
  authorRole: "EMT" | "DISPATCHER";
  content: string;
  createdAt: string;
};
export type EmtNote = BookingNote;
export type EmtSubscribePayload = {
  bookingId: string;
};
export type EmtAddNotePayload = {
  bookingId: string;
  content: string;
};
/**
 * Driver location update data
 */
export type DriverLocationUpdate = {
  id: string;
  x: number;
  y: number;
};
export type DriverRosterPayload = {
  providerId: string | null;
  action: "created" | "updated" | "removed";
  driver: {
    id: string;
    providerId?: string | null;
    status?: "AVAILABLE" | "BUSY" | "OFFLINE" | null;
    currentLocation?: {
      x: number;
      y: number;
    } | null;
    updatedAt?: string | Date;
  };
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
export type SocketErrorPayload = {
  code: string;
  message: string;
};
/**
 * Booking failed payload
 */
export type BookingFailedPayload = {
  reason: "no_drivers" | "no_dispatchers" | "all_rejected" | "error";
};
/**
 * Complete booking assignment payload sent when a booking is created
 * Structure matches the response from booking.service.ts createBooking method
 */
export type BookingAssignedPayload = {
  bookingId: string | null;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
  pickupLocation: {
    x: number;
    y: number;
  } | null;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
  };
  driver: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
    provider: {
      id: string;
      name: string;
    } | null;
  };
  hospital: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
  };
  provider: {
    id: string;
    name: string;
    hotlineNumber: string | null;
  } | null;
  patientProfileSnapshot?: PatientSettingsData | null;
  emtNotes?: BookingNote[];
};
/**
 * Booking request payload sent to dispatchers for approval
 * Used in booking:new event with callback acknowledgment
 */
export type BookingNewPayload = {
  requestId: string;
  driver: {
    id: string;
    phoneNumber: string | null;
    fullName?: string | null;
    currentLocation?: {
      x: number;
      y: number;
    } | null;
    ambulance_provider?: {
      id?: string;
      name?: string | null;
    } | null;
  };
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    currentLocation?: {
      x: number;
      y: number;
    } | null;
  };
};
/**
 * Dispatcher approval response
 */
export type DispatcherApprovalResponse = {
  approved: boolean;
};
export type BookingDecisionPayload = {
  requestId: string;
  isWinner: boolean;
  winner: {
    id: string;
    name: string | null;
    providerName: string | null;
  };
};
export type DispatcherBookingPayload = {
  bookingId: string;
  requestId?: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  pickupLocation: {
    x: number;
    y: number;
  } | null;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
  };
  driver: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
    provider: {
      id: string;
      name: string;
    } | null;
  };
  hospital: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    location: {
      x: number;
      y: number;
    } | null;
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
  providerId?: string | null;
};
export type DispatcherBookingLogPayload = {
  providerId: string;
  bookingId: string;
  status:
    | "REQUESTED"
    | "ASSIGNED"
    | "ARRIVED"
    | "PICKEDUP"
    | "COMPLETED"
    | "CANCELLED";
  updatedAt: string;
};
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
  "booking:failed": (data: BookingFailedPayload) => void;
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:arrived": (data: BookingEventPayload) => void;
  "booking:completed": (data: BookingEventPayload) => void;
  "booking:cancelled": (data: { bookingId: string; message: string }) => void;
  "booking:cancel:error": (data: ErrorPayload) => void;
  "socket:error": (data: SocketErrorPayload) => void;
}
/**
 * Events that drivers can send to the server
 */
export interface DriverToServerEvents {
  "driver:update": (data: DriverLocationPayload) => void;
  "driver:arrived": () => void;
  "driver:completed": () => void;
}
/**
 * Events that the server can send to drivers
 */
export interface ServerToDriverEvents {
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:cancelled": (data: BookingCancelledPayload) => void;
  "socket:error": (data: SocketErrorPayload) => void;
}
/**
 * Events that dispatchers can send to the server
 * Currently none - dispatchers respond via acknowledgment callbacks
 */
export interface DispatcherToServerEvents {}
/**
 * Events that the server can send to dispatchers
 */
export interface ServerToDispatcherEvents {
  "booking:new": (
    data: BookingNewPayload,
    callback: (response: DispatcherApprovalResponse) => void,
  ) => void;
  "booking:assigned": (data: DispatcherBookingPayload) => void;
  "booking:sync": (data: { bookings: DispatcherBookingPayload[] }) => void;
  "booking:update": (data: DispatcherBookingUpdatePayload) => void;
  "booking:decision": (data: BookingDecisionPayload) => void;
  "booking:log": (data: DispatcherBookingLogPayload) => void;
  "driver:update": (data: DriverLocationUpdate) => void;
  "driver:roster": (data: DriverRosterPayload) => void;
  "booking:notes": (data: { bookingId: string; note: BookingNote }) => void;
  "socket:error": (data: SocketErrorPayload) => void;
}

export interface EmtToServerEvents {
  "emt:subscribe": (data: EmtSubscribePayload) => void;
  "emt:note:add": (data: EmtAddNotePayload) => void;
}

export interface ServerToEmtEvents {
  "booking:assigned": (data: BookingAssignedPayload) => void;
  "booking:arrived": (data: BookingEventPayload) => void;
  "booking:completed": (data: BookingEventPayload) => void;
  "booking:cancelled": (data: BookingCancelledPayload) => void;
  "driver:update": (data: DriverLocationUpdate) => void;
  "booking:notes": (data: { bookingId: string; note: BookingNote }) => void;
  "socket:error": (data: SocketErrorPayload) => void;
}

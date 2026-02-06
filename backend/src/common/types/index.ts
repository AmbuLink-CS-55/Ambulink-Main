// Enums
export enum UserRole {
  PATIENT = "PATIENT",
  DISPATCHER = "DISPATCHER",
  DRIVER = "DRIVER",
  EMT = "EMT",
}

export enum UserStatus {
  AVAILABLE = "AVAILABLE",
  BUSY = "BUSY",
  OFFLINE = "OFFLINE",
}

export enum ProviderType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum AmbulanceStatus {
  AVAILABLE = "AVAILABLE",
  BUSY = "BUSY",
  OFFLINE = "OFFLINE",
}

export enum BookingStatus {
  REQUESTED = "REQUESTED",
  ASSIGNED = "ASSIGNED",
  ARRIVED = "ARRIVED",
  PICKEDUP = "PICKEDUP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

type AmbulanceProvider = {
  id: string;
  name: string;
};

export type NearByDriver = {
  id: string;
  phoneNumber: string | null;
  lat: number;
  lng: number;
  ambulance_provider: AmbulanceProvider;
  distance: number;
};

// Export socket event types
export * from "./socket.types";

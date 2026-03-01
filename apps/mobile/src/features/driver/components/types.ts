import type { BookingStatus } from "@ambulink/types";

export type MapPoint = { x: number; y: number };

export type Ride = {
  bookingId: string | null;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
  pickupLocation: MapPoint | null;
  patient: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: MapPoint | null;
  };
  driver: {
    id: string;
    fullName: string | null;
    phoneNumber: string | null;
    location: MapPoint | null;
    provider: { id: string; name: string } | null;
  };
  hospital: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    location: MapPoint | null;
  };
  provider: { id: string; name: string } | null;
};

export type RideMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RideStatus = BookingStatus;

export function isValidPoint(point?: MapPoint | null) {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

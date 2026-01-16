type GeoLocation = {
  lat: number,
  lng: number,
}

type RideStatus =
  | "SEARCHING"
  | "DRIVER_ASSIGNED"
  | "PICKEDUP"
  | "SUCCESS"
  | "EXPIRED"
  | "CANCELED";

type Ride = {
  id: rideId;
  patientId: patientId;
  driverId: driverId | null;
  pickup: GeoLocation;
  status: RideStatus;
  assignedDriverId?: string | null;
  offerIds: string[] | null;
  createdAt: number;
};

type OfferStatus = "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELED";

type Offer = {
  id: string;
  rideId: rideId;
  driverId: driverId;
  status: OfferStatus;
  expiresAt: number;
};

type DriverStatus = "INRIDE" | "FREE";

type Driver = {
  id: driverId
  status: DriverStatus
  location: GeoLocation
}

type patientId = string;
type driverId = string;
type rideId = string;

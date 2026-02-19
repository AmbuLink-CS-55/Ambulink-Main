import type { BookingAssignedPayload, BookingNewPayload } from "@/lib/socket-types";
import type { Hospital } from "@/lib/types";

import { create } from "zustand";

interface AppState {
  mapView: { center: [number, number]; zoom: number };
  setMapView: (view: { center: [number, number]; zoom: number }) => void;
  pendingBookingRequests: BookingNewPayload[];
  activeBookingRequests: BookingAssignedPayload[];
  hospitals: Hospital[];
  setHospitals: (hospitals: Hospital[]) => void;
  // bookingRequests:
  // ongoingBookings:
  // completedBookings:
}

export const useStore = create<AppState>((set) => ({
  mapView: { center: [79.87, 6.9], zoom: 11.5 },
  setMapView: (view) => set({ mapView: view }),
  pendingBookingRequests: [],
  activeBookingRequests: [],
  hospitals: [],
  setHospitals: (hospitals) => set({ hospitals }),
}));

import { create } from 'zustand';

interface BookingRequests {
  bookingId: string;
  patientId: string;
}

interface AppState {
  mapView: { center: [number, number]; zoom: number };
  setMapView: (view: { center: [number, number]; zoom: number }) => void;
  // bookingRequests:
  // ongoingBookings:
  // completedBookings:
}

export const useStore = create<AppState>((set) => ({
  mapView: { center: [79.87, 6.9], zoom: 11.5 },
  setMapView: (view) => set({ mapView: view }),
}));

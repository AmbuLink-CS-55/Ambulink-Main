import { create } from 'zustand';

interface AppState {
  mapView: { center: [number, number]; zoom: number };
  setMapView: (view: { center: [number, number]; zoom: number }) => void;
}

export const useStore = create<AppState>((set) => ({
  mapView: { center: [79.87, 6.9], zoom: 11.5 },
  setMapView: (view) => set({ mapView: view }),
}));

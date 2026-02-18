import { create } from "zustand";

interface DriverLocation {
  x: number;
  y: number;
}

interface DriverStore {
  driverLocations: Record<string, DriverLocation>;
  setDriverLocation: (id: string, location: DriverLocation) => void;
  removeDriver: (id: string) => void;
}

export const useDriverStore = create<DriverStore>((set) => ({
  driverLocations: {},
  setDriverLocation: (id, location) =>
    set((state) => ({
      driverLocations: { ...state.driverLocations, [id]: location },
    })),
  removeDriver: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.driverLocations;
      return { driverLocations: rest };
    }),
}));

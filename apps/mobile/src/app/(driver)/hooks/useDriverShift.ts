import { create } from "zustand";

type DriverShiftState = {
  isOnShift: boolean;
  setOnShift: (next: boolean) => void;
};

export const useDriverShift = create<DriverShiftState>((set) => ({
  isOnShift: false,
  setOnShift: (next) => set({ isOnShift: next }),
}));

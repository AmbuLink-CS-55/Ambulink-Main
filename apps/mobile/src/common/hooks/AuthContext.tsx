import { create } from "zustand";

export type Role = "patient" | "driver" | "emt";

type User = { id: string; role: Role };

type AuthState = {
  user: User | null;
  signInAs: (role: Role) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  signInAs: (role) => set({ user: { id: "demo", role } }),
  signOut: () => set({ user: null }),
}));

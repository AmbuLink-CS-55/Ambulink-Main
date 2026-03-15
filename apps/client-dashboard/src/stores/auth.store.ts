import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DispatcherSessionUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: "DISPATCHER";
  providerId: string | null;
};

export type DispatcherSession = {
  accessToken: string;
  expiresInSeconds: number;
  user: DispatcherSessionUser;
};

type AuthState = {
  session: DispatcherSession | null;
  setSession: (session: DispatcherSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "ambulink:dispatcher-auth:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export function getAccessToken() {
  return useAuthStore.getState().session?.accessToken;
}

export function getSessionUser() {
  return useAuthStore.getState().session?.user;
}

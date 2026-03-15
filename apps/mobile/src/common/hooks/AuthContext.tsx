import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type Role = "patient" | "driver" | "emt";

type User = {
  id: string;
  role: Role;
  email?: string;
  fullName?: string;
  providerId?: string | null;
};

type AuthSession = {
  accessToken: string;
  expiresInSeconds: number;
};

type AuthState = {
  user: User | null;
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signInStaff: (payload: {
    user: { id: string; role: "DRIVER" | "EMT" | "DISPATCHER"; email?: string | null; fullName?: string | null; providerId?: string | null };
    accessToken: string;
    expiresInSeconds: number;
  }) => Promise<void>;
  signInPatientGuest: (payload: {
    patient: { id: string; email?: string | null; fullName?: string | null };
    accessToken: string;
    expiresInSeconds: number;
  }) => Promise<void>;
  clearPatientSession: () => Promise<void>;
  signInAs: (role: Role) => void;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "ambulink.mobile.auth.v1";

function mapServerRole(role: "DRIVER" | "EMT" | "DISPATCHER"): Role {
  if (role === "DRIVER") return "driver";
  if (role === "EMT") return "emt";
  // Mobile app has no dispatcher UX yet; default to emt to avoid dead-end routes.
  return "emt";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as { user: User; session: AuthSession | null };
      if (parsed?.user && (parsed?.session?.accessToken || parsed.user.role === "patient")) {
        set({ user: parsed.user, session: parsed.session, hydrated: true });
        return;
      }
    } catch (error) {
      console.warn("[auth] failed to hydrate session", error);
    }

    set({ hydrated: true, user: null, session: null });
  },

  signInStaff: async ({ user, accessToken, expiresInSeconds }) => {
    const mappedUser: User = {
      id: user.id,
      role: mapServerRole(user.role),
      email: user.email ?? undefined,
      fullName: user.fullName ?? undefined,
      providerId: user.providerId ?? undefined,
    };
    const session: AuthSession = {
      accessToken,
      expiresInSeconds,
    };

    set({ user: mappedUser, session });
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({
        user: mappedUser,
        session,
      })
    );
  },

  signInPatientGuest: async ({ patient, accessToken, expiresInSeconds }) => {
    const mappedUser: User = {
      id: patient.id,
      role: "patient",
      email: patient.email ?? undefined,
      fullName: patient.fullName ?? "Guest",
      providerId: null,
    };
    const session: AuthSession = {
      accessToken,
      expiresInSeconds,
    };
    set({ user: mappedUser, session });
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({
        user: mappedUser,
        session,
      })
    );
  },

  clearPatientSession: async () => {
    const current = get().user;
    if (!current || current.role !== "patient") return;
    const nextUser: User = {
      id: "guest",
      role: "patient",
    };
    set({ user: nextUser, session: null });
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({
        user: nextUser,
        session: null,
      })
    );
  },

  signInAs: (role) => set({ user: { id: "demo", role }, session: null }),

  signOut: async () => {
    set({ user: null, session: null });
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  },
}));

export function getAuthAccessToken() {
  return useAuthStore.getState().session?.accessToken ?? null;
}

export function getAuthUser() {
  return useAuthStore.getState().user;
}

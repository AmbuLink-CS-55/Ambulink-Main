import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DashboardSettings = {
  desktopNotificationsEnabled: boolean;
};

type DashboardSettingsState = {
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  resetSettings: () => void;
};

const DEFAULT_SETTINGS: DashboardSettings = {
  desktopNotificationsEnabled: true,
};

export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
          },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "ambulink:dashboard-settings:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

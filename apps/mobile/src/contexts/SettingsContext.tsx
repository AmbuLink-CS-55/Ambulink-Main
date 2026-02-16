import { createContext, ReactNode, useContext } from "react";
import { useSettingsLogic, type UseSettingsLogicReturn } from "@/hooks/useSettingsLogic";

const SettingsContext = createContext<UseSettingsLogicReturn | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settingsLogic = useSettingsLogic();

  return (
    <SettingsContext.Provider value={settingsLogic}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSettings, saveSettings } from "@/common/utils/settingsStorage";
import type { NotificationActorRole } from "./types";

const KEY_DRIVER = "ambulink:settings:driver:notifications:v1";
const KEY_EMT = "ambulink:settings:emt:notifications:v1";

export async function areNotificationsEnabled(role: NotificationActorRole): Promise<boolean> {
  if (role === "PATIENT") {
    const settings = await loadSettings();
    return settings.notifications;
  }

  const key = role === "DRIVER" ? KEY_DRIVER : KEY_EMT;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return true;
    return raw === "true";
  } catch (error) {
    console.error("[notifications] Failed to read preferences", error);
    return true;
  }
}

export async function setNotificationsEnabled(
  role: NotificationActorRole,
  enabled: boolean
): Promise<void> {
  if (role === "PATIENT") {
    const settings = await loadSettings();
    await saveSettings({ ...settings, notifications: enabled });
    return;
  }

  const key = role === "DRIVER" ? KEY_DRIVER : KEY_EMT;
  try {
    await AsyncStorage.setItem(key, String(enabled));
  } catch (error) {
    console.error("[notifications] Failed to save preferences", error);
  }
}

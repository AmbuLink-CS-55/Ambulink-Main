import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppNotification, NotificationActorRole } from "./types";

const MAX_ENTRIES = 100;

const KEY_BY_ROLE: Record<NotificationActorRole, string> = {
  PATIENT: "ambulink:notifications:patient:v1",
  DRIVER: "ambulink:notifications:driver:v1",
  EMT: "ambulink:notifications:emt:v1",
};

type NotificationListener = (items: AppNotification[]) => void;

const listeners: Record<NotificationActorRole, Set<NotificationListener>> = {
  PATIENT: new Set(),
  DRIVER: new Set(),
  EMT: new Set(),
};

function notify(role: NotificationActorRole, items: AppNotification[]) {
  listeners[role].forEach((listener) => listener(items));
}

export async function loadNotificationInbox(role: NotificationActorRole): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_BY_ROLE[role]);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch (error) {
    console.error("[notifications] Failed to load inbox", error);
    return [];
  }
}

export async function addInboxNotification(
  role: NotificationActorRole,
  notification: AppNotification
): Promise<AppNotification[] | null> {
  try {
    const existing = await loadNotificationInbox(role);
    const next = [notification, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY_BY_ROLE[role], JSON.stringify(next));
    notify(role, next);
    return next;
  } catch (error) {
    console.error("[notifications] Failed to persist inbox notification", error);
    return null;
  }
}

export function subscribeNotificationInbox(
  role: NotificationActorRole,
  listener: NotificationListener
): () => void {
  listeners[role].add(listener);
  return () => listeners[role].delete(listener);
}

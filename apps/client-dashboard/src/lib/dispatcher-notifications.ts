import type {
  BookingEtaUpdatedPayload,
  BookingReroutedPayload,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
} from "@/lib/socket-types";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";

type NotificationEventType = "ASSIGNED" | "ETA_UPDATED" | "ARRIVED" | "REROUTED" | "CANCELLED";

type DispatcherInboxNotification = {
  id: string;
  type: NotificationEventType;
  bookingId: string;
  title: string;
  body: string;
  timestamp: string;
  dedupeKey: string;
  providerId?: string | null;
};

const KEY_INBOX = "ambulink:notifications:dispatcher:v1";
const MAX_ENTRIES = 100;
const DEDUPE_WINDOW_MS = 10_000;
const dedupeMap = new Map<string, number>();

const withBookingSuffix = (bookingId: string) => bookingId.slice(0, 8);

function nowIso() {
  return new Date().toISOString();
}

function shouldDedupe(dedupeKey: string): boolean {
  const now = Date.now();
  const last = dedupeMap.get(dedupeKey) ?? 0;
  if (now - last < DEDUPE_WINDOW_MS) return true;
  dedupeMap.set(dedupeKey, now);
  return false;
}

function readInbox(): DispatcherInboxNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_INBOX);
    return raw ? (JSON.parse(raw) as DispatcherInboxNotification[]) : [];
  } catch {
    return [];
  }
}

function writeInbox(items: DispatcherInboxNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_INBOX, JSON.stringify(items.slice(0, MAX_ENTRIES)));
}

function appendInbox(item: DispatcherInboxNotification) {
  const existing = readInbox();
  writeInbox([item, ...existing]);
}

export function isDispatcherDesktopNotificationsEnabled() {
  return useDashboardSettingsStore.getState().settings.desktopNotificationsEnabled;
}

export function setDispatcherDesktopNotificationsEnabled(enabled: boolean) {
  useDashboardSettingsStore.getState().updateSettings({
    desktopNotificationsEnabled: enabled,
  });
}

export function requestDispatcherNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => undefined);
  }
}

function dispatchBrowserNotification(item: DispatcherInboxNotification): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!isDispatcherDesktopNotificationsEnabled()) return false;
  if (Notification.permission !== "granted") return false;

  new Notification(item.title, {
    body: item.body,
    tag: item.dedupeKey,
  });
  return true;
}

function buildAssignedNotification(payload: DispatcherBookingPayload): DispatcherInboxNotification {
  return {
    id: `${payload.bookingId}:ASSIGNED:${Date.now()}`,
    type: "ASSIGNED",
    bookingId: payload.bookingId,
    title: "Booking Assigned",
    body: `Booking #${withBookingSuffix(payload.bookingId)} has been assigned.`,
    timestamp: nowIso(),
    dedupeKey: `dispatcher:${payload.bookingId}:ASSIGNED`,
    providerId: payload.provider?.id,
  };
}

function buildUpdateNotification(
  payload: DispatcherBookingUpdatePayload
): DispatcherInboxNotification | null {
  if (payload.status === "ARRIVED") {
    return {
      id: `${payload.bookingId}:ARRIVED:${Date.now()}`,
      type: "ARRIVED",
      bookingId: payload.bookingId,
      title: "Ambulance Arrived",
      body: `Arrival confirmed for booking #${withBookingSuffix(payload.bookingId)}.`,
      timestamp: nowIso(),
      dedupeKey: `dispatcher:${payload.bookingId}:ARRIVED`,
      providerId: payload.providerId,
    };
  }

  if (payload.status === "CANCELLED") {
    return {
      id: `${payload.bookingId}:CANCELLED:${Date.now()}`,
      type: "CANCELLED",
      bookingId: payload.bookingId,
      title: "Booking Cancelled",
      body: `Booking #${withBookingSuffix(payload.bookingId)} was cancelled.`,
      timestamp: nowIso(),
      dedupeKey: `dispatcher:${payload.bookingId}:CANCELLED`,
      providerId: payload.providerId,
    };
  }

  return null;
}

function buildEtaNotification(
  payload: BookingEtaUpdatedPayload & { providerId?: string | null }
): DispatcherInboxNotification {
  return {
    id: `${payload.bookingId}:ETA:${Date.now()}`,
    type: "ETA_UPDATED",
    bookingId: payload.bookingId,
    title: "ETA Updated",
    body: `Updated ETA: ${payload.etaMinutes} min for booking #${withBookingSuffix(payload.bookingId)}.`,
    timestamp: nowIso(),
    dedupeKey: `dispatcher:${payload.bookingId}:ETA:${payload.etaMinutes}`,
    providerId: payload.providerId,
  };
}

function buildReroutedNotification(
  payload: BookingReroutedPayload & { providerId?: string | null }
): DispatcherInboxNotification {
  return {
    id: `${payload.bookingId}:REROUTED:${Date.now()}`,
    type: "REROUTED",
    bookingId: payload.bookingId,
    title: "Route Updated",
    body: `${payload.reason} (booking #${withBookingSuffix(payload.bookingId)}).`,
    timestamp: nowIso(),
    dedupeKey: `dispatcher:${payload.bookingId}:REROUTED:${payload.reason}`,
    providerId: payload.providerId,
  };
}

function publishIfEligible(
  item: DispatcherInboxNotification,
  providerId?: string
): void {
  const desktopNotificationsEnabled = isDispatcherDesktopNotificationsEnabled();
  if (!desktopNotificationsEnabled) {
    return;
  }

  if (providerId && item.providerId && providerId !== item.providerId) {
    return;
  }

  if (shouldDedupe(item.dedupeKey)) {
    return;
  }

  appendInbox(item);
  dispatchBrowserNotification(item);
}

export function notifyDispatcherAssigned(payload: DispatcherBookingPayload, providerId?: string) {
  publishIfEligible(buildAssignedNotification(payload), providerId);
}

export function notifyDispatcherUpdate(
  payload: DispatcherBookingUpdatePayload,
  providerId?: string
) {
  const item = buildUpdateNotification(payload);
  if (!item) return;
  publishIfEligible(item, providerId);
}

export function notifyDispatcherEta(
  payload: BookingEtaUpdatedPayload & { providerId?: string | null },
  providerId?: string
) {
  publishIfEligible(buildEtaNotification(payload), providerId);
}

export function notifyDispatcherRerouted(
  payload: BookingReroutedPayload & { providerId?: string | null },
  providerId?: string
) {
  publishIfEligible(buildReroutedNotification(payload), providerId);
}

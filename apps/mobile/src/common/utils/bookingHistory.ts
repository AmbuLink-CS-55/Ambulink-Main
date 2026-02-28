import AsyncStorage from "@react-native-async-storage/async-storage";

export type BookingHistoryRole = "PATIENT" | "DRIVER";

export type BookingHistoryEntry = {
  id: string;
  bookingId?: string | null;
  role: BookingHistoryRole;
  status: "COMPLETED" | "CANCELLED";
  patientName?: string | null;
  driverName?: string | null;
  hospitalName?: string | null;
  providerName?: string | null;
  providerHotline?: string | null;
  createdAt: string;
};

const KEY_BY_ROLE: Record<BookingHistoryRole, string> = {
  PATIENT: "ambulink:history:patient:v1",
  DRIVER: "ambulink:history:driver:v1",
};

const MAX_ENTRIES = 50;

type HistoryListener = (items: BookingHistoryEntry[]) => void;

const listeners: Record<BookingHistoryRole, Set<HistoryListener>> = {
  PATIENT: new Set(),
  DRIVER: new Set(),
};

function notify(role: BookingHistoryRole, items: BookingHistoryEntry[]) {
  listeners[role].forEach((listener) => listener(items));
}

export async function loadBookingHistory(role: BookingHistoryRole) {
  try {
    const raw = await AsyncStorage.getItem(KEY_BY_ROLE[role]);
    return raw ? (JSON.parse(raw) as BookingHistoryEntry[]) : [];
  } catch (error) {
    console.error("[history] Failed to load history", error);
    return [];
  }
}

export async function addBookingHistory(role: BookingHistoryRole, entry: BookingHistoryEntry) {
  try {
    const existing = await loadBookingHistory(role);
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY_BY_ROLE[role], JSON.stringify(next));
    notify(role, next);
    return next;
  } catch (error) {
    console.error("[history] Failed to save history", error);
    return null;
  }
}

export async function clearBookingHistory(role: BookingHistoryRole) {
  try {
    await AsyncStorage.removeItem(KEY_BY_ROLE[role]);
    notify(role, []);
  } catch (error) {
    console.error("[history] Failed to clear history", error);
  }
}

export function subscribeBookingHistory(
  role: BookingHistoryRole,
  listener: HistoryListener
): () => void {
  listeners[role].add(listener);
  return () => listeners[role].delete(listener);
}

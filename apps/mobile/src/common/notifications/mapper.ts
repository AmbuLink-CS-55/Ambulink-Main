import type { AppNotification, NotificationActorRole, SocketNotificationPayload } from "./types";

const MAX_BOOKING_SUFFIX = 8;

const bookingSuffix = (bookingId: string) => bookingId.slice(0, MAX_BOOKING_SUFFIX);

export function toAppNotification(
  role: NotificationActorRole,
  payload: SocketNotificationPayload
): AppNotification {
  const timestamp = new Date().toISOString();

  if (payload.type === "ASSIGNED") {
    return {
      id: `${payload.bookingId}:${payload.type}:${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: "Booking Assigned",
      body: `Booking #${bookingSuffix(payload.bookingId)} has been assigned.`,
      timestamp,
      actorRole: role,
      dedupeKey: `${role}:${payload.bookingId}:${payload.type}`,
    };
  }

  if (payload.type === "ETA_UPDATED") {
    return {
      id: `${payload.bookingId}:${payload.type}:${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: "ETA Updated",
      body: `Updated ETA: ${payload.etaMinutes} min for booking #${bookingSuffix(payload.bookingId)}.`,
      timestamp,
      actorRole: role,
      dedupeKey: `${role}:${payload.bookingId}:${payload.type}:${payload.etaMinutes}`,
    };
  }

  if (payload.type === "ARRIVED") {
    return {
      id: `${payload.bookingId}:${payload.type}:${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: "Ambulance Arrived",
      body: `Arrival confirmed for booking #${bookingSuffix(payload.bookingId)}.`,
      timestamp,
      actorRole: role,
      dedupeKey: `${role}:${payload.bookingId}:${payload.type}`,
    };
  }

  if (payload.type === "REROUTED") {
    return {
      id: `${payload.bookingId}:${payload.type}:${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: "Route Updated",
      body: `${payload.reason} (booking #${bookingSuffix(payload.bookingId)}).`,
      timestamp,
      actorRole: role,
      dedupeKey: `${role}:${payload.bookingId}:${payload.type}:${payload.reason}`,
    };
  }

  return {
    id: `${payload.bookingId}:${payload.type}:${Date.now()}`,
    type: payload.type,
    bookingId: payload.bookingId,
    title: "Booking Cancelled",
    body: `${payload.reason ?? "Booking was cancelled"} (booking #${bookingSuffix(payload.bookingId)}).`,
    timestamp,
    actorRole: role,
    dedupeKey: `${role}:${payload.bookingId}:${payload.type}`,
  };
}

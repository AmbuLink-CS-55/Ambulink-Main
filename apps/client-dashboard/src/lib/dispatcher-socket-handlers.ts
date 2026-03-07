import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearBookingDecision,
  removeBookingRequest,
  setBookingDecision,
  upsertBookingRequest,
} from "@/lib/booking-cache-ops";
import type { BookingRequestEntity } from "@/lib/booking-types";
import type {
  BookingNote,
  BookingNewPayload,
  DispatcherDecisionAckPayload,
  DispatcherPendingSyncPayload,
  DispatcherBookingLogPayload,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DispatcherToServerEvents,
  DriverLocationUpdate,
  DriverRosterPayload,
  ServerToDispatcherEvents,
} from "@/lib/socket-types";
import type { BookingLogEntry } from "@/services/booking.service";

type DispatcherSocket = import("socket.io-client").Socket<
  ServerToDispatcherEvents,
  DispatcherToServerEvents
>;

function parseTimestamp(value: string, fallbackMs: number) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallbackMs;
}

function toBookingRequestEntity(payload: BookingNewPayload): BookingRequestEntity {
  const now = Date.now();
  return {
    requestId: payload.requestId,
    data: payload,
    timestamp: parseTimestamp(payload.createdAt, now),
    expiresAt: parseTimestamp(payload.expiresAt, now + 30_000),
  };
}

function applyStatusTimestamp(
  entry: BookingLogEntry,
  status: BookingLogEntry["status"],
  timestamp: string
) {
  if (status === "ASSIGNED") {
    return { ...entry, assignedAt: entry.assignedAt ?? timestamp };
  }
  if (status === "ARRIVED") {
    return { ...entry, arrivedAt: entry.arrivedAt ?? timestamp };
  }
  if (status === "PICKEDUP") {
    return { ...entry, pickedupAt: entry.pickedupAt ?? timestamp };
  }
  if (status === "COMPLETED") {
    return { ...entry, completedAt: entry.completedAt ?? timestamp };
  }
  return entry;
}

export function registerDispatcherSocketHandlers({
  queryClient,
  socket,
  providerId,
}: {
  queryClient: QueryClient;
  socket: DispatcherSocket;
  providerId?: string;
}) {
  socket.on("booking:new", (data: BookingNewPayload) => {
    upsertBookingRequest(queryClient, toBookingRequestEntity(data));
  });

  socket.on("booking:pending-sync", (payload: DispatcherPendingSyncPayload) => {
    const nextEntities = payload.requests.map(toBookingRequestEntity);
    const nextIds = nextEntities.map((item) => item.requestId);
    const prevIds = queryClient.getQueryData<string[]>(queryKeys.bookingRequestIds()) ?? [];

    prevIds.forEach((requestId) => {
      if (nextIds.includes(requestId)) return;
      queryClient.removeQueries({ queryKey: queryKeys.bookingRequest(requestId), exact: true });
      clearBookingDecision(queryClient, requestId);
    });

    nextEntities.forEach((request) => {
      queryClient.setQueryData(queryKeys.bookingRequest(request.requestId), request);
    });
    queryClient.setQueryData(queryKeys.bookingRequestIds(), nextIds);
  });

  socket.on("booking:decision", (payload) => setBookingDecision(queryClient, payload));

  socket.on("booking:decision-ack", (payload: DispatcherDecisionAckPayload) => {
    if (!payload.accepted) {
      removeBookingRequest(queryClient, payload.requestId);
      clearBookingDecision(queryClient, payload.requestId);
      return;
    }

    // Rejected decisions should disappear immediately for this dispatcher.
    if (!payload.approved) {
      removeBookingRequest(queryClient, payload.requestId);
      clearBookingDecision(queryClient, payload.requestId);
    }
  });

  socket.on("booking:sync", (data: { bookings: DispatcherBookingPayload[] }) => {
    const next: Record<string, DispatcherBookingPayload> = {};
    const nextDriverLocations: Record<string, { x: number; y: number }> = {};
    data.bookings.forEach((booking) => {
      next[booking.bookingId] = booking;
      if (
        booking.driver.id &&
        booking.driver.location &&
        Number.isFinite(booking.driver.location.x) &&
        Number.isFinite(booking.driver.location.y)
      ) {
        nextDriverLocations[booking.driver.id] = {
          x: booking.driver.location.x,
          y: booking.driver.location.y,
        };
      }
    });
    queryClient.setQueryData(queryKeys.ongoingBookings(), next);
    if (Object.keys(nextDriverLocations).length > 0) {
      queryClient.setQueryData<Record<string, { x: number; y: number }>>(
        queryKeys.driverLocations(),
        (prev = {}) => ({
          ...prev,
          ...nextDriverLocations,
        })
      );
    }
  });

  socket.on("booking:assigned", (payload: DispatcherBookingPayload) => {
    queryClient.setQueryData<Record<string, DispatcherBookingPayload>>(
      queryKeys.ongoingBookings(),
      (prev = {}) => ({
        ...prev,
        [payload.bookingId]: { ...prev[payload.bookingId], ...payload },
      })
    );
    if (
      payload.driver.id &&
      payload.driver.location &&
      Number.isFinite(payload.driver.location.x) &&
      Number.isFinite(payload.driver.location.y)
    ) {
      queryClient.setQueryData<Record<string, { x: number; y: number }>>(
        queryKeys.driverLocations(),
        (prev = {}) => ({
          ...prev,
          [payload.driver.id]: {
            x: payload.driver.location!.x,
            y: payload.driver.location!.y,
          },
        })
      );
    }
    queryClient.invalidateQueries({ queryKey: ["booking-log"] });
  });

  socket.on("booking:update", (payload: DispatcherBookingUpdatePayload) => {
    const matchesProvider = !providerId || !payload.providerId || payload.providerId === providerId;
    if (!matchesProvider) return;
    queryClient.setQueryData<Record<string, DispatcherBookingPayload>>(
      queryKeys.ongoingBookings(),
      (prev = {}) => {
        const current = prev[payload.bookingId];
        if (!current) return prev;
        if (payload.status === "COMPLETED" || payload.status === "CANCELLED") {
          const next = { ...prev };
          delete next[payload.bookingId];
          return next;
        }
        return {
          ...prev,
          [payload.bookingId]: {
            ...current,
            status: payload.status,
            updatedAt: payload.updatedAt,
          },
        };
      }
    );

    queryClient.setQueryData<BookingLogEntry[]>(
      queryKeys.bookingLog(providerId ?? null),
      (prev = []) => {
        const index = prev.findIndex((entry) => entry.bookingId === payload.bookingId);
        if (index === -1) return prev;
        const next = [...prev];
        const updated = applyStatusTimestamp(
          { ...next[index], status: payload.status, updatedAt: payload.updatedAt },
          payload.status,
          payload.updatedAt
        );
        next[index] = updated;
        return next;
      }
    );
    queryClient.invalidateQueries({ queryKey: ["booking-log"] });
  });

  socket.on("driver:update", (payload: DriverLocationUpdate) => {
    queryClient.setQueryData<Record<string, { x: number; y: number }>>(
      queryKeys.driverLocations(),
      (prev = {}) => ({
        ...prev,
        [payload.id]: { x: payload.x, y: payload.y },
      })
    );
  });

  socket.on("driver:roster", (payload: DriverRosterPayload) => {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });

    const driverId = payload?.driver?.id;
    if (!driverId) return;
    const status = payload.driver.status ?? null;
    const location = payload.driver.currentLocation ?? null;

    queryClient.setQueryData<Record<string, { x: number; y: number }>>(
      queryKeys.driverLocations(),
      (prev = {}) => {
        const next = { ...prev };
        if (
          payload.action === "removed" ||
          status !== "AVAILABLE" ||
          !location ||
          !Number.isFinite(location.x) ||
          !Number.isFinite(location.y)
        ) {
          delete next[driverId];
          return next;
        }
        next[driverId] = { x: location.x, y: location.y };
        return next;
      }
    );
  });

  socket.on("booking:log", (payload: DispatcherBookingLogPayload) => {
    if (providerId && payload.providerId !== providerId) return;

    queryClient.setQueryData<BookingLogEntry[]>(
      queryKeys.bookingLog(providerId ?? null),
      (prev = []) => {
        const index = prev.findIndex((entry) => entry.bookingId === payload.bookingId);
        if (index === -1) {
          const nextEntry = applyStatusTimestamp(
            {
              bookingId: payload.bookingId,
              status: payload.status,
              updatedAt: payload.updatedAt,
              requestedAt: null,
              assignedAt: null,
              arrivedAt: null,
              pickedupAt: null,
              completedAt: null,
              fareEstimate: null,
              fareFinal: null,
              cancellationReason: null,
              patientId: null,
              patientName: null,
              patientPhone: null,
              driverId: null,
              driverName: null,
              driverPhone: null,
              ambulanceId: null,
              providerId: payload.providerId ?? null,
              providerName: null,
              hospitalId: null,
              hospitalName: null,
            },
            payload.status,
            payload.updatedAt
          );
          return [nextEntry, ...prev];
        }

        const next = [...prev];
        const updated = applyStatusTimestamp(
          {
            ...next[index],
            status: payload.status,
            updatedAt: payload.updatedAt,
          },
          payload.status,
          payload.updatedAt
        );
        next[index] = updated;
        return next;
      }
    );
    queryClient.invalidateQueries({ queryKey: ["booking-log"] });
  });

  socket.on("booking:notes", (payload: { bookingId: string; note: BookingNote }) => {
    queryClient.setQueryData<{ notes: BookingNote[] } | undefined>(
      queryKeys.bookingDetails(payload.bookingId),
      (prev) => {
        if (!prev) return prev;
        if ((prev.notes ?? []).some((note) => note.id === payload.note.id)) return prev;
        return {
          ...prev,
          notes: [payload.note, ...(prev.notes ?? [])],
        };
      }
    );
  });

  return () => {
    socket.off("booking:new");
    socket.off("booking:pending-sync");
    socket.off("booking:decision-ack");
    socket.off("booking:decision");
    socket.off("booking:sync");
    socket.off("booking:assigned");
    socket.off("booking:update");
    socket.off("driver:update");
    socket.off("driver:roster");
    socket.off("booking:log");
    socket.off("booking:notes");
  };
}

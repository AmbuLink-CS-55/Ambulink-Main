import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BookingNote,
  DispatcherBookingLogPayload,
  DispatcherToServerEvents,
  ServerToDispatcherEvents,
} from "@/lib/socket-types";
import type { BookingLogEntry } from "@/services/booking.service";
import { notifyDispatcherUpdate } from "@/lib/dispatcher-notifications";

type DispatcherSocket = import("socket.io-client").Socket<
  ServerToDispatcherEvents,
  DispatcherToServerEvents
>;

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
  socket.on("booking:update", (payload) => {
    const matchesProvider = !providerId || !payload.providerId || payload.providerId === providerId;
    if (!matchesProvider) return;
    if (payload.status !== "COMPLETED") return;

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
    notifyDispatcherUpdate(payload, providerId);
  });

  socket.on("booking:log", (payload: DispatcherBookingLogPayload) => {
    if (providerId && payload.providerId !== providerId) return;
    if (payload.status !== "COMPLETED") return;

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
    socket.off("booking:update");
    socket.off("booking:log");
    socket.off("booking:notes");
  };
}

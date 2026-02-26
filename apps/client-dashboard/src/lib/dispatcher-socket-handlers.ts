import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  setBookingDecision,
  upsertBookingRequest,
} from "@/lib/booking-cache-ops";
import { setBookingRequestCallback } from "@/lib/booking-request-callbacks";
import type {
  BookingNewPayload,
  DispatcherApprovalResponse,
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

export function registerDispatcherSocketHandlers({
  queryClient,
  socket,
  providerId,
}: {
  queryClient: QueryClient;
  socket: DispatcherSocket;
  providerId?: string;
}) {
  socket.on(
    "booking:new",
    (data: BookingNewPayload, callback: (res: DispatcherApprovalResponse) => void) => {
      setBookingRequestCallback(data.requestId, callback);
      upsertBookingRequest(queryClient, {
        requestId: data.requestId,
        data,
        timestamp: Date.now(),
      });
    }
  );

  socket.on("booking:decision", (payload) => setBookingDecision(queryClient, payload));

  socket.on("booking:sync", (data: { bookings: DispatcherBookingPayload[] }) => {
    const next: Record<string, DispatcherBookingPayload> = {};
    data.bookings.forEach((booking) => {
      next[booking.bookingId] = booking;
    });
    queryClient.setQueryData(queryKeys.ongoingBookings(), next);
  });

  socket.on("booking:assigned", (payload: DispatcherBookingPayload) => {
    queryClient.setQueryData<Record<string, DispatcherBookingPayload>>(
      queryKeys.ongoingBookings(),
      (prev = {}) => ({
        ...prev,
        [payload.bookingId]: { ...prev[payload.bookingId], ...payload },
      })
    );
  });

  socket.on("booking:update", (payload: DispatcherBookingUpdatePayload) => {
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

    queryClient.setQueryData<BookingLogEntry[]>(queryKeys.bookingLog(providerId ?? null), (prev = []) => {
      const index = prev.findIndex((entry) => entry.bookingId === payload.bookingId);
      if (index === -1) {
        return [
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
          ...prev,
        ];
      }

      const next = [...prev];
      next[index] = {
        ...next[index],
        status: payload.status,
        updatedAt: payload.updatedAt,
      };
      return next;
    });
  });

  return () => {
    socket.off("booking:new");
    socket.off("booking:decision");
    socket.off("booking:sync");
    socket.off("booking:assigned");
    socket.off("booking:update");
    socket.off("driver:update");
    socket.off("driver:roster");
    socket.off("booking:log");
  };
}

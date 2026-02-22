import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import env from "../../env";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearBookingDecisions,
  clearBookingRequests,
  setBookingDecision,
  upsertBookingRequest,
} from "@/lib/booking-cache-ops";
import { setBookingRequestCallback } from "@/lib/booking-request-callbacks";
import type {
  BookingNewPayload,
  DispatcherApprovalResponse,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DispatcherBookingLogPayload,
  DispatcherToServerEvents,
  DriverLocationUpdate,
  ServerToDispatcherEvents,
} from "@/lib/socket-types";
import { dispatcherSocket } from "@/lib/dispatcher-socket";
import type { BookingLogEntry } from "@/services/booking.service";

export function useDispatcherSocketSync() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socket = dispatcherSocket as unknown as import("socket.io-client").Socket<
    ServerToDispatcherEvents,
    DispatcherToServerEvents
  >;

  useEffect(() => {
    console.info("[dispatcher-socket] hook_mount");
    socket.on("connect", () => {
      setConnected(true);
      clearBookingRequests(queryClient);
      clearBookingDecisions(queryClient);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      console.error("[socket] Connection failed:", {
        message: error.message,
        type: error.name,
      });
    });

    socket.on(
      "booking:new",
      (data: BookingNewPayload, callback: (res: DispatcherApprovalResponse) => void) => {
        setBookingRequestCallback(data.requestId, callback);
        upsertBookingRequest(queryClient, {
          requestId: data.requestId,
          data: data,
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

    socket.on("booking:log", (payload: DispatcherBookingLogPayload) => {
      if (env.VITE_PROVIDER_ID && payload.providerId !== env.VITE_PROVIDER_ID) return;
      queryClient.setQueryData<BookingLogEntry[]>(
        queryKeys.bookingLog(env.VITE_PROVIDER_ID ?? null),
        (prev = []) => {
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
        }
      );
    });

    return () => {
      console.info("[dispatcher-socket] hook_unmount");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("booking:new");
      socket.off("booking:decision");
      socket.off("booking:sync");
      socket.off("booking:assigned");
      socket.off("booking:update");
      socket.off("driver:update");
      socket.off("booking:log");
    };
  }, [queryClient]);

  return { socket, connected };
}

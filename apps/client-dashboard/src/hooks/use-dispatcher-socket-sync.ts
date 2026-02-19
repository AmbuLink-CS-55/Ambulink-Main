import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import env from "../../env";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BookingDecisionPayload,
  BookingNewPayload,
  DispatcherApprovalResponse,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DispatcherToServerEvents,
  DriverLocationUpdate,
  ServerToDispatcherEvents,
} from "@/lib/socket-types";
import { dispatcherSocket } from "@/lib/dispatcher-socket";

type BookingRequest = {
  requestId: string;
  data: BookingNewPayload;
  callback: (response: DispatcherApprovalResponse) => void;
  timestamp: number;
};

type BookingDecisionState = {
  status: "pending" | "won" | "lost";
  winner: BookingDecisionPayload["winner"];
};

type BookingLogEntry = {
  bookingId: string;
  status: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
  fareEstimate: string | null;
  fareFinal: string | null;
  cancellationReason: string | null;
  patientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  ambulanceId: string | null;
  providerId: string | null;
  providerName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
};

export function useDispatcherSocketSync() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socket = dispatcherSocket as unknown as import("socket.io-client").Socket<
    ServerToDispatcherEvents,
    DispatcherToServerEvents
  >;

  useEffect(() => {
    console.info("[dispatcher-socket] hook_mount");
    socket.on("connect", () => setConnected(true));
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
        queryClient.setQueryData<BookingRequest[]>(queryKeys.bookingRequests(), (prev = []) => [
          ...prev,
          { requestId: data.requestId, data, callback, timestamp: Date.now() },
        ]);
      }
    );

    socket.on("booking:decision", (payload: BookingDecisionPayload) => {
      queryClient.setQueryData<Record<string, BookingDecisionState>>(
        queryKeys.bookingDecisions(),
        (prev = {}) => ({
          ...prev,
          [payload.requestId]: {
            status: payload.isWinner ? "won" : "lost",
            winner: payload.winner,
          },
        })
      );
    });

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

    socket.on("booking:log", (payload) => {
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
              } as BookingLogEntry,
              ...prev,
            ];
          }
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: payload.status,
            updatedAt: payload.updatedAt,
          } as BookingLogEntry;
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

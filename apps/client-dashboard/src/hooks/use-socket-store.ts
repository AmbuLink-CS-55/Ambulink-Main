import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import env from "../../env";
import type {
  BookingNewPayload,
  BookingDecisionPayload,
  DispatcherApprovalResponse,
  ServerToDispatcherEvents,
  DispatcherToServerEvents,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DriverLocationUpdate,
} from "@/lib/socket-types";

export interface BookingRequest {
  requestId: string;
  data: BookingNewPayload;
  callback: (response: DispatcherApprovalResponse) => void;
  timestamp: number;
}

export interface BookingDecisionState {
  status: "pending" | "won" | "lost";
  winner: BookingDecisionPayload["winner"];
}

export interface OngoingBookingState extends DispatcherBookingPayload {
  updatedAt?: string;
}

interface SocketState {
  socket: Socket<ServerToDispatcherEvents, DispatcherToServerEvents> | null;
  isConnected: boolean;
  bookingRequests: BookingRequest[];
  bookingDecisions: Record<string, BookingDecisionState>;
  ongoingBookings: Record<string, OngoingBookingState>;
  bookingLogUpdates: Record<string, { status: string; updatedAt: string; providerId?: string }>;
  connect: () => void;
  disconnect: () => void;
  addBookingRequest: (request: BookingRequest) => void;
  removeBookingRequest: (requestId: string) => void;
  clearBookingRequests: () => void;
  setBookingDecision: (payload: BookingDecisionPayload) => void;
  setBookingDecisionPending: (requestId: string) => void;
  clearBookingDecision: (requestId: string) => void;
  syncOngoingBookings: (payload: DispatcherBookingPayload[]) => void;
  upsertOngoingBooking: (payload: DispatcherBookingPayload) => void;
  updateOngoingBooking: (payload: DispatcherBookingUpdatePayload) => void;
  updateDriverLocation: (payload: DriverLocationUpdate) => void;
  removeOngoingBooking: (bookingId: string) => void;
  addBookingLogUpdate: (payload: {
    bookingId: string;
    status: string;
    updatedAt: string;
    providerId?: string;
  }) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  bookingRequests: [],
  bookingDecisions: {},
  ongoingBookings: {},
  bookingLogUpdates: {},

  addBookingRequest: (request) =>
    set((state) => ({
      bookingRequests: [...state.bookingRequests, request],
    })),

  removeBookingRequest: (requestId) =>
    set((state) => ({
      bookingRequests: state.bookingRequests.filter((req) => req.requestId !== requestId),
    })),

  clearBookingRequests: () => set({ bookingRequests: [] }),

  setBookingDecision: (payload) =>
    set((state) => ({
      bookingDecisions: {
        ...state.bookingDecisions,
        [payload.requestId]: {
          status: payload.isWinner ? "won" : "lost",
          winner: payload.winner,
        },
      },
    })),

  setBookingDecisionPending: (requestId) =>
    set((state) => ({
      bookingDecisions: {
        ...state.bookingDecisions,
        [requestId]: {
          status: "pending",
          winner: { id: "", name: null, providerName: null },
        },
      },
    })),

  clearBookingDecision: (requestId) =>
    set((state) => {
      const next = { ...state.bookingDecisions };
      delete next[requestId];
      return { bookingDecisions: next };
    }),

  syncOngoingBookings: (payloads) =>
    set(() => {
      const next: Record<string, OngoingBookingState> = {};
      payloads.forEach((payload) => {
        next[payload.bookingId] = payload;
      });
      return { ongoingBookings: next };
    }),

  upsertOngoingBooking: (payload) =>
    set((state) => ({
      ongoingBookings: {
        ...state.ongoingBookings,
        [payload.bookingId]: {
          ...state.ongoingBookings[payload.bookingId],
          ...payload,
        },
      },
    })),

  updateOngoingBooking: (payload) =>
    set((state) => {
      const current = state.ongoingBookings[payload.bookingId];
      if (!current) return state;
      if (payload.status === "COMPLETED" || payload.status === "CANCELLED") {
        const next = { ...state.ongoingBookings };
        delete next[payload.bookingId];
        return { ongoingBookings: next };
      }
      return {
        ongoingBookings: {
          ...state.ongoingBookings,
          [payload.bookingId]: {
            ...current,
            status: payload.status,
            updatedAt: payload.updatedAt,
          },
        },
      };
    }),

  updateDriverLocation: (payload) =>
    set((state) => {
      const next = { ...state.ongoingBookings };
      let updated = false;
      Object.entries(next).forEach(([bookingId, booking]) => {
        if (booking.driver.id && booking.driver.id === payload.id) {
          next[bookingId] = {
            ...booking,
            driver: {
              ...booking.driver,
              location: { x: payload.x, y: payload.y },
            },
          };
          updated = true;
        }
      });
      return updated ? { ongoingBookings: next } : state;
    }),

  removeOngoingBooking: (bookingId) =>
    set((state) => {
      const next = { ...state.ongoingBookings };
      delete next[bookingId];
      return { ongoingBookings: next };
    }),

  addBookingLogUpdate: (payload) =>
    set((state) => ({
      bookingLogUpdates: {
        ...state.bookingLogUpdates,
        [payload.bookingId]: {
          status: payload.status,
          updatedAt: payload.updatedAt,
          providerId: payload.providerId,
        },
      },
    })),

  connect: () => {
    if (get().socket?.connected) return;

    const socketUrl = `${env!.VITE_WS_SERVER_URL}/dispatcher`;
    const socket = io(socketUrl, {
      auth: { dispatcherId: env!.VITE_DISPATCHER_ID },
      transports: ["websocket"],
    });

    socket.on("connect", () => set({ isConnected: true }));
    socket.on("connect_error", (error) => {
      console.error("[socket] Connection failed:", {
        message: error.message,
        type: error.name,
      });
    });
    socket.on("disconnect", () => set({ isConnected: false }));

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

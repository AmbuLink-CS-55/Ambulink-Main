import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import env from "../../env";
import type {
  BookingNewPayload,
  BookingDecisionPayload,
  DispatcherApprovalResponse,
  ServerToDispatcherEvents,
  DispatcherToServerEvents,
} from "@/lib/types";

export interface BookingRequest {
  requestId: string;
  data: BookingNewPayload;
  callback: (response: DispatcherApprovalResponse) => void;
  timestamp: Date;
}

export interface BookingDecisionState {
  status: "pending" | "won" | "lost";
  winner: BookingDecisionPayload["winner"];
}

interface SocketState {
  socket: Socket<ServerToDispatcherEvents, DispatcherToServerEvents> | null;
  isConnected: boolean;
  bookingRequests: BookingRequest[];
  bookingDecisions: Record<string, BookingDecisionState>;
  connect: () => void;
  disconnect: () => void;
  addBookingRequest: (request: BookingRequest) => void;
  removeBookingRequest: (requestId: string) => void;
  setBookingDecision: (payload: BookingDecisionPayload) => void;
  setBookingDecisionPending: (requestId: string) => void;
  clearBookingDecision: (requestId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  bookingRequests: [],
  bookingDecisions: {},

  addBookingRequest: (request) =>
    set((state) => ({
      bookingRequests: [...state.bookingRequests, request],
    })),

  removeBookingRequest: (requestId) =>
    set((state) => ({
      bookingRequests: state.bookingRequests.filter((req) => req.requestId !== requestId),
    })),

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

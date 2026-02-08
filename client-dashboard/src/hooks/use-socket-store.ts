import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import env from "../../env";
import type { 
  BookingNewPayload, 
  DispatcherApprovalResponse,
  ServerToDispatcherEvents,
  DispatcherToServerEvents
} from "@/lib/types";

export interface BookingRequest {
  requestId: string;
  data: BookingNewPayload;
  callback: (response: DispatcherApprovalResponse) => void;
  timestamp: Date;
}

interface SocketState {
  socket: Socket<ServerToDispatcherEvents, DispatcherToServerEvents> | null;
  isConnected: boolean;
  bookingRequests: BookingRequest[];
  connect: () => void;
  disconnect: () => void;
  addBookingRequest: (request: BookingRequest) => void;
  removeBookingRequest: (requestId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  bookingRequests: [],

  addBookingRequest: (request) =>
    set((state) => ({
      bookingRequests: [...state.bookingRequests, request],
    })),

  removeBookingRequest: (requestId) =>
    set((state) => ({
      bookingRequests: state.bookingRequests.filter(
        (req) => req.requestId !== requestId
      ),
    })),

  connect: () => {
    if (get().socket?.connected) return;

    const socketUrl = `${env!.VITE_WS_SERVER_URL}/dispatcher`;
    const socket = io(socketUrl, {
      auth: {
        dispatcherId: env!.VITE_DISPATCHER_ID,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected", {
        url: socketUrl,
        namespace: "/dispatcher",
      });
      set({ isConnected: true });
    });
    socket.on("connect_error", (error) => {
      console.error("[socket] connect_error", {
        url: socketUrl,
        namespace: "/dispatcher",
        message: error?.message,
      });
    });
    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", {
        url: socketUrl,
        namespace: "/dispatcher",
        reason,
      });
      set({ isConnected: false });
    });
    socket.io.on("reconnect_attempt", (attempt) => {
      console.info("[socket] reconnect_attempt", {
        url: socketUrl,
        namespace: "/dispatcher",
        attempt,
      });
    });

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

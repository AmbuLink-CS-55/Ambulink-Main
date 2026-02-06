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

    const socket = io(`${env!.VITE_WS_SERVER_URL}/dispatcher`, {
      auth: {
        dispatcherId: env!.VITE_DISPATCHER_ID,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => set({ isConnected: true }));
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

import { io, type Socket } from "socket.io-client";
import env from "../../env";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "./socket-types";

const socketUrl = `${env.VITE_WS_SERVER_URL}/dispatcher`;

export const dispatcherSocket = io(socketUrl, {
  auth: { dispatcherId: env.VITE_DISPATCHER_ID },
  transports: ["websocket"],
}) as Socket<ServerToDispatcherEvents, DispatcherToServerEvents>;

console.info("[dispatcher-socket] initialized", {
  url: socketUrl,
  dispatcherId: env.VITE_DISPATCHER_ID,
});

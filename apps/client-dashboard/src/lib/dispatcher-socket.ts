import { io, type Socket } from "socket.io-client";
import env from "../../env";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "./socket-types";
import { getDispatcherId } from "./identity";

const socketUrl = `${env.VITE_WS_SERVER_URL}/dispatcher`;
const dispatcherId = getDispatcherId();

export const dispatcherSocket = io(socketUrl, {
  auth: { dispatcherId },
  transports: ["websocket"],
}) as Socket<ServerToDispatcherEvents, DispatcherToServerEvents>;

console.info("[dispatcher-socket] initialized", {
  url: socketUrl,
  dispatcherId,
});

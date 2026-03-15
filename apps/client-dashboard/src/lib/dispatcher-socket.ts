import { io, type Socket } from "socket.io-client";
import env from "../../env";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "./socket-types";
import { getAccessToken, getSessionUser } from "@/stores/auth.store";

const socketUrl = `${env.VITE_WS_SERVER_URL}/dispatcher`;

let dispatcherSocket: Socket<ServerToDispatcherEvents, DispatcherToServerEvents> | null = null;

function buildAuth() {
  const user = getSessionUser();
  return {
    dispatcherId: user?.id,
    accessToken: getAccessToken(),
  };
}

export function getDispatcherSocket() {
  if (!dispatcherSocket) {
    dispatcherSocket = io(socketUrl, {
      autoConnect: false,
      auth: buildAuth(),
      transports: ["websocket"],
    }) as Socket<ServerToDispatcherEvents, DispatcherToServerEvents>;
  }

  dispatcherSocket.auth = buildAuth();

  if (!dispatcherSocket.connected && getSessionUser()?.id) {
    dispatcherSocket.connect();
  }

  return dispatcherSocket;
}

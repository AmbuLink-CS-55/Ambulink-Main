import { io, Socket } from "socket.io-client";

// change the url according to your IP
export const socket = io("http://192.168.1.3:3000/ride", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
});

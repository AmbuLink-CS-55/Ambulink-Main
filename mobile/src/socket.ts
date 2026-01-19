import { io } from "socket.io-client";

// hey this is my ip, change to yours
const socket = io("http://192.168.1.3:3000", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
});

export default socket;

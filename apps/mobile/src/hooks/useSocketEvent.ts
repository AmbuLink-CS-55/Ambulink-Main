import { useEffect } from "react";
import { useSocket } from "./SocketContext";

export const useSocketEvent = (event: string, callback: (...args: any[]) => void) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
};

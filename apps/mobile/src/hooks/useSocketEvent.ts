import { useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";

export const useSocketEvent = (event: string, callback: (...args: any[]) => void) => {
  const socket = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;
    const handler = (...args: any[]) => callbackRef.current?.(...args);
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event]);
};

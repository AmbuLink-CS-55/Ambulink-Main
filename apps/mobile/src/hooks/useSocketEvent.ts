import { useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";

export const useSocketEvent = <TArgs extends unknown[]>(
  event: string,
  callback: (...args: TArgs) => void
) => {
  const socket = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;
    const handler = (...args: unknown[]) => callbackRef.current?.(...(args as TArgs));
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event]);
};

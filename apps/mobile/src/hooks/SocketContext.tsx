import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { SocketClientCreator } from "@/utils/socket";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({
  type,
  enabled = true,
  children,
}: {
  type: "PATIENT" | "DRIVER" | "EMT";
  enabled?: boolean;
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      SocketClientCreator.disconnect(type);
      setSocket(null);
      return;
    }

    let isMounted = true;

    const init = async () => {
      const instance = await SocketClientCreator.getSocket(type);
      console.info("[socket] Initializing connection:", { type });
      if (isMounted) {
        setSocket(instance);
      }
    };

    init();

    return () => {
      isMounted = false;
      // socket.disconnect(); kill when leaving the group
    };
  }, [enabled, type]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);

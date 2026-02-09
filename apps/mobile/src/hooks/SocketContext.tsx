import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { SocketClientCreator } from "@/utils/socket";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ type, children }: { type: "PATIENT" | "DRIVER" | "EMT", children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const instance = await SocketClientCreator.getSocket(type);
      console.log("creating socket", type)
      if (isMounted) setSocket(instance);
    };

    init();

    return () => {
      isMounted = false;
      // socket.disconnect(); kill when leaving the group
    };
  }, [type]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

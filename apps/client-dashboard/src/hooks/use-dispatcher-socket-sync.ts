import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import env from "../../env";
import { registerDispatcherSocketHandlers } from "@/lib/dispatcher-socket-handlers";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "@/lib/socket-types";
import { dispatcherSocket } from "@/lib/dispatcher-socket";

export function useDispatcherSocketSync() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socket = dispatcherSocket as unknown as import("socket.io-client").Socket<
    ServerToDispatcherEvents,
    DispatcherToServerEvents
  >;

  useEffect(() => {
    console.info("[dispatcher-socket] hook_mount");
    const teardownEventHandlers = registerDispatcherSocketHandlers({
      queryClient,
      socket,
      providerId: env.VITE_PROVIDER_ID,
    });

    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      console.error("[socket] Connection failed:", {
        message: error.message,
        type: error.name,
      });
    });

    return () => {
      console.info("[dispatcher-socket] hook_unmount");
      teardownEventHandlers();
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [queryClient, socket]);

  return { socket, connected };
}

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import env from "../../env";
import { registerDispatcherSocketHandlers } from "@/lib/dispatcher-socket-handlers";
import type { DispatcherToServerEvents, ServerToDispatcherEvents } from "@/lib/socket-types";
import { dispatcherSocket } from "@/lib/dispatcher-socket";
import { requestDispatcherNotificationPermission } from "@/lib/dispatcher-notifications";

export function useDispatcherSocketSync() {
  const queryClient = useQueryClient();
  const socket = dispatcherSocket as unknown as import("socket.io-client").Socket<
    ServerToDispatcherEvents,
    DispatcherToServerEvents
  >;
  const [connected, setConnected] = useState(() => socket.connected);

  useEffect(() => {
    console.info("[dispatcher-socket] hook_mount");
    requestDispatcherNotificationPermission();
    const teardownEventHandlers = registerDispatcherSocketHandlers({
      queryClient,
      socket,
      providerId: env.VITE_PROVIDER_ID,
    });

    const requestSync = () => {
      socket.emit("booking:sync:request");
      socket.emit("booking:pending-sync:request");
    };

    socket.on("connect", () => {
      setConnected(true);
      requestSync();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      console.error("[socket] Connection failed:", {
        message: error.message,
        type: error.name,
      });
    });

    if (socket.connected) requestSync();

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

import { AppSidebar } from "@/components";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useDispatcherSocketSync } from "@/hooks/use-dispatcher-socket-sync";
import { useEffect } from "react";
import { BookingRequestOverlay } from "@/pages/layouts/components";
import type { SocketErrorPayload } from "@/lib/socket-types";

export function DashboardLayout() {
  useEffect(() => {
    console.info("[dashboard] mount");
    return () => {
      console.info("[dashboard] unmount");
    };
  }, []);

  const { socket, connected } = useDispatcherSocketSync();

  // socket error logging
  useEffect(() => {
    if (!socket) return;
    socket.on("socket:error", (data: SocketErrorPayload) => {
      console.warn("[socket] error", data);
    });

    return () => {
      socket.off("socket:error");
    };
  }, [socket]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto w-full">
          <SidebarTrigger className={"m-2"} size={"icon"} />
          {/*<div className="w-full h-screen">*/}
          <Outlet />
          {/*</div>*/}
        </main>

        {/* Booking Request Overlay */}
        <BookingRequestOverlay socketConnected={connected} socket={socket} />
      </div>
    </SidebarProvider>
  );
}

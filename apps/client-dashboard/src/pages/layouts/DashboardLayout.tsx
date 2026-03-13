import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useDispatcherSocketSync } from "@/hooks/use-dispatcher-socket-sync";
import { useEffect } from "react";
import type { SocketErrorPayload } from "@/lib/socket-types";

export function DashboardLayout() {
  const { socket } = useDispatcherSocketSync();

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
      </div>
    </SidebarProvider>
  );
}

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useEffect } from "react";

export function DashboardLayout() {

  const connectSocket = useSocketStore((state) => state.connect)
  const disconnectSocket = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    connectSocket("ws://192.168.1.3:3000")
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket])

  return (
    <SidebarProvider >
      <div className="flex h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto w-full">
          <SidebarTrigger className={"m-2"} size={"icon"} />
          <div className="w-full h-screen">
            <Outlet />
          </div>
        </main>

        <div className="z-10">

        </div>
      </div>
    </SidebarProvider>
  )

}

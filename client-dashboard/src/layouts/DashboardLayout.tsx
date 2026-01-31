import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {

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
      </div>
    </SidebarProvider>
  )

}

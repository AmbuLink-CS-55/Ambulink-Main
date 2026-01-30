import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {


  return (
    <SidebarProvider >
      <div className="flex h-screen">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto">
          <SidebarTrigger />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )

}

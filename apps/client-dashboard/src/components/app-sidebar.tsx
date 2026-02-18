import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Ambulance, Users, Map, ClipboardList } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const MENU_ITEMS = [
  { title: "Dashboard Home", path: "/", icon: Map },
  { title: "Ambulances", path: "/ambulances", icon: Ambulance },
  { title: "Drivers", path: "/drivers", icon: Users },
  { title: "Booking Log", path: "/booking", icon: ClipboardList },
] as const;

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-2 border-b">
        <h1 className="font-bold text-xl items-center text-center">Dispatch.Ambulink</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <Link to={item.path}>
                      <SidebarMenuButton isActive={isActive}>
                        <item.icon className="mr-2 size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <SidebarMenuButton variant="outline">
          <Link to="/login" className="justify-center w-full flex">
            Logout
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

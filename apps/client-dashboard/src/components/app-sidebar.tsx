import { Link, useLocation } from "react-router-dom";
import { Ambulance, Users, Map, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

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
import {
  isDispatcherDesktopNotificationsEnabled,
  requestDispatcherNotificationPermission,
  setDispatcherDesktopNotificationsEnabled,
} from "@/lib/dispatcher-notifications";

const MENU_ITEMS = [
  { title: "Dashboard Home", path: "/", icon: Map },
  { title: "Ambulances", path: "/ambulances", icon: Ambulance },
  { title: "Drivers", path: "/drivers", icon: Users },
  { title: "EMTs", path: "/emts", icon: Users },
  { title: "Booking Log", path: "/booking", icon: ClipboardList },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(() =>
    isDispatcherDesktopNotificationsEnabled()
  );

  useEffect(() => {
    if (desktopNotificationsEnabled) {
      requestDispatcherNotificationPermission();
    }
  }, [desktopNotificationsEnabled]);

  const onDesktopNotificationsToggle = (checked: boolean) => {
    setDesktopNotificationsEnabled(checked);
    setDispatcherDesktopNotificationsEnabled(checked);
    if (checked) {
      requestDispatcherNotificationPermission();
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex-row items-center justify-center gap-0 border-b px-4 py-0">
        <div className="text-center text-xl font-bold leading-none">Dispatch.Ambulink</div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Primary">
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
                      <SidebarMenuButton
                        isActive={isActive}
                        aria-current={isActive ? "page" : undefined}
                        render={<Link to={item.path} />}
                      >
                        <item.icon className="mr-2 size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <label className="mb-3 flex items-center justify-between gap-2 text-sm">
          <span>Desktop notifications</span>
          <input
            type="checkbox"
            checked={desktopNotificationsEnabled}
            onChange={(event) => onDesktopNotificationsToggle(event.target.checked)}
          />
        </label>
        <SidebarMenuButton
          variant="outline"
          render={<Link to="/login" className="justify-center" />}
        >
          Logout
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

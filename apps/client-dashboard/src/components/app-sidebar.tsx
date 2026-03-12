import { Link, useLocation } from "react-router-dom";
import { Ambulance, Users, Map, ClipboardList, Settings2, ChartColumn } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  requestDispatcherNotificationPermission,
  setDispatcherDesktopNotificationsEnabled,
} from "@/lib/dispatcher-notifications";
import { THEME_MODE_OPTIONS, type ThemeMode } from "@/lib/theme-mode";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";

const MENU_ITEMS = [
  { title: "Dashboard Home", path: "/", icon: Map },
  { title: "Ambulances", path: "/ambulances", icon: Ambulance },
  { title: "Drivers", path: "/drivers", icon: Users },
  { title: "EMTs", path: "/emts", icon: Users },
  { title: "Booking Log", path: "/booking", icon: ClipboardList },
  { title: "Analytics", path: "/analytics", icon: ChartColumn },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const desktopNotificationsEnabled = useDashboardSettingsStore(
    (state) => state.settings.desktopNotificationsEnabled
  );
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const updateSettings = useDashboardSettingsStore((state) => state.updateSettings);

  useEffect(() => {
    if (desktopNotificationsEnabled) {
      requestDispatcherNotificationPermission();
    }
  }, [desktopNotificationsEnabled]);

  const onDesktopNotificationsToggle = (checked: boolean) => {
    setDispatcherDesktopNotificationsEnabled(checked);
    if (checked) {
      requestDispatcherNotificationPermission();
    }
  };

  const onThemeModeChange = (nextMode: ThemeMode) => {
    updateSettings({ themeMode: nextMode });
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
        <Button variant="outline" className="w-full justify-center" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="mr-2 size-4" />
          Settings
        </Button>
      </SidebarFooter>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Configure runtime preferences for the dispatcher dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <fieldset className="mb-6 rounded-md border border-[color:var(--border)] p-3">
              <legend className="px-1 text-sm font-medium text-foreground">Theme mode</legend>
              <div className="mt-2 space-y-2">
                {THEME_MODE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/30"
                  >
                    <input
                      type="radio"
                      name="theme-mode"
                      value={option.value}
                      checked={themeMode === option.value}
                      onChange={() => onThemeModeChange(option.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-medium text-foreground">Desktop notifications</div>
                <div className="text-xs text-muted-foreground">
                  Browser/OS notifications while dashboard is open.
                </div>
              </div>
              <input
                type="checkbox"
                checked={desktopNotificationsEnabled}
                onChange={(event) => onDesktopNotificationsToggle(event.target.checked)}
              />
            </label>
            <div className="mt-6">
              <Link to="/login" onClick={() => setSettingsOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

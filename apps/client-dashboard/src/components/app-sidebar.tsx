import { Link, useLocation } from "react-router-dom";
import { Ambulance, Users, Map, ClipboardList, Settings2, ChartColumn, Bot, FileText } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  requestDispatcherNotificationPermission,
  setDispatcherDesktopNotificationsEnabled,
} from "@/lib/dispatcher-notifications";
import { THEME_MODE_OPTIONS, type ThemeMode } from "@/lib/theme-mode";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateStaffInvite } from "@/services/auth.service";
import { getDispatcherSocket } from "@/lib/dispatcher-socket";
import { toUiErrorMessage } from "@/lib/ui-error";

const MENU_ITEMS = [
  { title: "Dashboard Home", path: "/", icon: Map },
  { title: "Ambulances", path: "/ambulances", icon: Ambulance },
  { title: "Dispatchers", path: "/dispatcher", icon: Users },
  { title: "Drivers", path: "/drivers", icon: Users },
  { title: "EMTs", path: "/emts", icon: Users },
  { title: "Booking Log", path: "/booking", icon: ClipboardList },
] as const;

const ANALYTICS_MENU_ITEMS = [
  { title: "Analytics", path: "/analytics", icon: ChartColumn },
  { title: "AI", path: "/analytics/ai", icon: Bot },
  { title: "Reports", path: "/analytics/reports", icon: FileText },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const desktopNotificationsEnabled = useDashboardSettingsStore(
    (state) => state.settings.desktopNotificationsEnabled
  );
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const updateSettings = useDashboardSettingsStore((state) => state.updateSettings);
  const clearSession = useAuthStore((state) => state.clearSession);
  const sessionUser = useAuthStore((state) => state.session?.user ?? null);
  const isDispatcherAdmin = Boolean(sessionUser?.isDispatcherAdmin);
  const createInvite = useCreateStaffInvite();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedInviteToken, setCopiedInviteToken] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

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

  const onCreateInvite = async () => {
    setInviteError(null);
    setInviteToken(null);
    setInviteLink(null);
    setCopiedInviteToken(false);
    setCopiedInviteLink(false);
    try {
      const response = await createInvite.mutateAsync({
        role: "DISPATCHER",
        email: inviteEmail.trim(),
      });
      setInviteToken(response.inviteToken);
      const base = window.location.origin.replace(/\/+$/, "");
      setInviteLink(`${base}/login?inviteToken=${encodeURIComponent(response.inviteToken)}`);
    } catch (error) {
      console.error("[invite] create failed", error);
      setInviteError(toUiErrorMessage(error, "Failed to generate invite token."));
    }
  };

  const onCopyInviteToken = async () => {
    if (!inviteToken) return;
    try {
      await navigator.clipboard.writeText(inviteToken);
      setCopiedInviteToken(true);
      setTimeout(() => setCopiedInviteToken(false), 1500);
    } catch {
      setInviteError("Failed to copy token");
    }
  };

  const onCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 1500);
    } catch {
      setInviteError("Failed to copy invite link");
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
                        render={<Link to={{ pathname: item.path, search: location.search }} />}
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

          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ANALYTICS_MENU_ITEMS.map((item) => {
                  const isActive =
                    item.path === "/analytics"
                      ? location.pathname === "/analytics"
                      : location.pathname.startsWith(item.path);

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        aria-current={isActive ? "page" : undefined}
                        render={<Link to={{ pathname: item.path, search: location.search }} />}
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
              {sessionUser ? (
                <p className="mb-3 text-xs text-muted-foreground">
                  Signed in as {sessionUser.email ?? "dispatcher"}
                </p>
              ) : null}
              <div className="mb-3 space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="text-sm font-medium text-foreground">Invite Dispatcher</div>
                <Input
                  type="email"
                  placeholder="Invite dispatcher email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
                {isDispatcherAdmin ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => void onCreateInvite()}
                    disabled={createInvite.isPending || !inviteEmail.trim()}
                  >
                    {createInvite.isPending ? "Generating..." : "Generate Dispatcher Invite"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only dispatcher admins can generate invite links.
                  </p>
                )}
                {inviteToken ? (
                  <div className="rounded bg-muted/50 p-2 text-xs text-foreground">
                    <p className="mb-2 text-muted-foreground">
                      Share this link with the dispatcher to set their password and activate.
                    </p>
                    <p className="break-all">
                      Token: <span className="font-bold">{inviteToken}</span>
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full justify-center"
                      onClick={() => void onCopyInviteToken()}
                    >
                      {copiedInviteToken ? "Copied" : "Copy Token"}
                    </Button>
                    {inviteLink ? (
                      <>
                        <p className="mt-3 break-all">
                          Invite link: <span className="font-bold">{inviteLink}</span>
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full justify-center"
                          onClick={() => void onCopyInviteLink()}
                        >
                          {copiedInviteLink ? "Copied" : "Copy Invite Link"}
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {inviteError ? <p className="text-xs text-destructive">{inviteError}</p> : null}
              </div>
              <Link
                to="/login"
                onClick={() => {
                  getDispatcherSocket().disconnect();
                  clearSession();
                  setSettingsOpen(false);
                }}
              >
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

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Ambulance, Users, UserRound, Map } from "lucide-react";

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

const RESOURCE_GROUPS = [
  {
    title: "Ambulances",
    basePath: "/ambulances",
    icon: Ambulance,
    items: [
      { title: "Dashboard", url: "" },
      { title: "Add New", url: "new" },
    ],
  },
  {
    title: "Drivers",
    basePath: "/drivers",
    icon: Users,
    items: [
      { title: "Dashboard", url: "" },
      { title: "Add New", url: "new" },
    ],
  },
  {
    title: "Patients",
    basePath: "/patients",
    icon: UserRound,
    items: [
      { title: "Dashboard", url: "" },
      { title: "Register", url: "new" },
    ],
  },
] as const;

interface ResourceGroup {
  title: string;
  basePath: string;
  icon: React.ComponentType<{ className?: string }>;
  items: readonly { title: string; url: string }[];
}

function ResourceSection({ group }: { group: ResourceGroup }) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const location = useLocation();
  const Icon = group.icon;

  React.useEffect(() => {
    if (location.pathname.startsWith(group.basePath)) {
      setIsExpanded(true);
    }
  }, [location.pathname, group.basePath]);

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel
          className="cursor-pointer flex-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <button className="flex items-center w-full text-sm font-medium outline-none">
            <Icon className="mr-2 size-4" />
            {group.title}
            <ChevronDown
              className={`ml-auto size-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </SidebarGroupLabel>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <SidebarGroupContent className="pt-1">
            <SidebarMenu>
              {group.items.map((item) => {
                const path = item.url ? `${group.basePath}/${item.url}` : group.basePath;
                const isActive = location.pathname === path;

                return (
                  <SidebarMenuItem key={path}>
                    <Link to={path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className="pl-8 text-sidebar-foreground/70 data-[active=true]:text-sidebar-foreground"
                      >
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </div>
      </div>
    </SidebarGroup>
  );
}

export function AppSidebar() {
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
              <SidebarMenuItem>
                <Link to="/">
                  <SidebarMenuButton>
                    <Map />
                    <span>Dashboard Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {RESOURCE_GROUPS.map((group) => (
          <ResourceSection key={group.title} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <SidebarMenuButton variant="outline">
          <Link to="/login" className="justify-center">
            Logout
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

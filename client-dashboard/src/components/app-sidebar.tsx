import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Ambulance,
  Users,
  UserRound,
  Map,
} from "lucide-react";

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

const resourceGroups = [
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
];

function CollapsibleResourceGroup({ group }: { group: typeof resourceGroups[0] }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.startsWith(group.basePath)) {
      setIsOpen(true);
    }
  }, [location.pathname, group.basePath]);

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel
          className="cursor-pointer flex-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <button className="flex items-center w-full text-sm font-medium outline-none">
            <group.icon className="mr-2 size-4" />
            {group.title}
            <ChevronDown
              className={`ml-auto size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                }`}
            />
          </button>
        </SidebarGroupLabel>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
      >
        <div className="overflow-hidden">
          <SidebarGroupContent className="pt-1">
            <SidebarMenu>
              {group.items.map((item) => {
                const suffix = item.url ? `/${item.url}` : "";
                const absoluteUrl = `${group.basePath}${suffix}`;
                const isActive = location.pathname === absoluteUrl;

                return (
                  <SidebarMenuItem key={absoluteUrl}>
                    <Link to={absoluteUrl}>
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
        <h1 className="font-bold text-xl items-center text-center ">
          Dispatch.Ambulink
        </h1>
      </SidebarHeader>

      <SidebarContent>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link to="/">
                  <SidebarMenuButton tooltip="Dashboard">
                    <Map />
                    <span>Dashboard Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {resourceGroups.map((group) => (
          <CollapsibleResourceGroup key={group.title} group={group} />
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

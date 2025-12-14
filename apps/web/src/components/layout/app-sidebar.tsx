import * as React from "react";
import { Zap, BookOpen, LayoutDashboard, DatabaseZap } from "lucide-react";
import { useLocation, Link } from "react-router";

import { useAuth } from "@/context/auth-context";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const userData = {
    name: user?.name || "Usuário",
    email: user?.email || "",
    avatar: "",
  };

  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname === "/dashboard",
    },
    {
      title: "Gerenciar",
      url: "#",
      icon: DatabaseZap,
      isActive: ["/plants", "/units", "/unit", "/plant"].some((path) =>
        pathname.startsWith(path)
      ),

      items: [
        {
          title: "Plantas",
          url: "/plants",
          isActive:
            pathname.startsWith("/plants") || pathname.startsWith("/plant/"),
        },
        {
          title: "Unidades",
          url: "/units",
          isActive: pathname.startsWith("/unit") || pathname === "/units",
        },
      ],
    },
    {
      title: "Documentação",
      url: "#",
      icon: BookOpen,
      isActive: false,
      items: [
        {
          title: "Tutoriais",
          url: "#",
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4 fill-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Energy Meter</span>
                  <span className="truncate text-xs">IoT Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

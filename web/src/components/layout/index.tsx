import { Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full relative">
        <div className="absolute top-4 left-4 z-10 md:hidden">
          {/* Trigger flutuante apenas em mobile para não sobrepor header do dashboard desktop */}
          <SidebarTrigger />
        </div>

        {/* Trigger fixo no desktop se preferir, ou integrado */}
        <div className="hidden md:flex items-center p-4 pb-0">
          <SidebarTrigger />
        </div>

        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

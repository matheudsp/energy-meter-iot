import { Fragment } from "react";
import { Outlet, useLocation, Link } from "react-router";
import { AppSidebar } from "./app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type BreadcrumbRoute = {
  label: string;
  href: string | null;
};

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname;

  const getBreadcrumbs = (): BreadcrumbRoute[] => {
    if (pathname === "/" || pathname === "/dashboard") {
      return [{ label: "Dashboard", href: null }];
    }

    const items: BreadcrumbRoute[] = [{ label: "Início", href: "/dashboard" }];

    if (pathname === "/plants") {
      items.push({ label: "Plantas", href: null });
    } else if (pathname.startsWith("/plants/")) {
      const id = pathname.split("/").pop();
      items.push({ label: "Plantas", href: "/plants" });
      items.push({ label: `${id}`, href: null });
    }
    if (pathname === "/units") {
      items.push({ label: "Unidades", href: null });
    } else if (pathname.startsWith("/units/")) {
      const id = pathname.split("/").pop();
      items.push({ label: "Unidades", href: "/units" });
      items.push({ label: `${id}`, href: null });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <Fragment key={index}>
                    <BreadcrumbItem
                      className={index === 0 ? "hidden md:block" : ""}
                    >
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate max-w-[150px] md:max-w-[300px]">
                          {item.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>

                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator
                        className={index === 0 ? "hidden md:block" : ""}
                      />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 ">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

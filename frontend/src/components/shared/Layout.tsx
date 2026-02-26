import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";

import { SidebarNav } from "./SidebarNav";

export function Layout() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 280, breakpoint: "sm" }} padding="md">
      <AppShell.Header>
        <div className="flex h-full w-full items-center justify-between px-4">
          <span className="font-semibold">Admin Panel</span>
        </div>
      </AppShell.Header>
      <AppShell.Navbar>
        <SidebarNav />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

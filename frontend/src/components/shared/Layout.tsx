import { useState } from "react";
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";

import { SidebarNav } from "./SidebarNav";

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        breakpoint: "sm",
      }}
      padding="md"
    >
      <AppShell.Header>
        <div className="flex h-full w-full items-center justify-between px-4">
          <span className="font-semibold">Admin Panel</span>
        </div>
      </AppShell.Header>
      <AppShell.Navbar>
        <SidebarNav collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

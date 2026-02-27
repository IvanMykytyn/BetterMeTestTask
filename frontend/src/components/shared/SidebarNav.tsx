import { NavLink, useLocation } from "react-router-dom";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { clsx } from "clsx";

import type { FooterItem, NavItem } from "@/constants/navigation";
import { FOOTER_ITEMS, NAV_ITEMS } from "@/constants/navigation";

const navLinkStyles =
  "group flex items-center no-underline text-sm font-medium py-1.5 px-2 rounded-sm " +
  "text-nav-text hover:bg-nav-bg-hover hover:text-nav-text-hover";

const navLinkIconStyles =
  "size-[25px] shrink-0 stroke-[1.5] text-nav-icon group-hover:text-nav-text-hover";

function isNavActive(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavLinkItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = isNavActive(item.path, pathname);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={clsx(
        navLinkStyles,
        collapsed && "justify-center px-2",
        isActive &&
          "bg-nav-active! text-nav-active-text! hover:bg-nav-active! hover:text-nav-active-text!",
      )}
    >
      <Icon
        className={clsx(
          collapsed ? "" : "mr-2",
          navLinkIconStyles,
          isActive && "text-nav-active-text! group-hover:text-nav-active-text!",
        )}
        stroke={1.5}
      />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function FooterLinkItem({
  item,
  collapsed,
}: {
  item: FooterItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <a
      href="#"
      title={collapsed ? item.label : undefined}
      className={clsx(navLinkStyles, collapsed && "justify-center px-2")}
      onClick={(e) => e.preventDefault()}
    >
      <Icon className={clsx(collapsed ? "" : "mr-2", navLinkIconStyles)} stroke={1.5} />
      {!collapsed && <span>{item.label}</span>}
    </a>
  );
}

interface SidebarNavProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SidebarNav({ collapsed, onToggleCollapsed }: SidebarNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className={clsx(
        "relative flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar-bg p-4 transition-all",
        collapsed && "p-2",
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-bg shadow-sm text-nav-text hover:bg-nav-bg-hover hover:text-nav-text-hover transition-colors cursor-pointer"
      >
        {collapsed ? (
          <IconChevronRight className="size-4" stroke={1.5} />
        ) : (
          <IconChevronLeft className="size-4" stroke={1.5} />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.path} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </div>

      <div className="flex flex-col gap-y-1 border-t border-sidebar-border pt-4">
        {FOOTER_ITEMS.map((item) => (
          <FooterLinkItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}

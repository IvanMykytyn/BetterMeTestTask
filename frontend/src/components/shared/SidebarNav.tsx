import { NavLink, useLocation } from "react-router-dom";
import { clsx } from "clsx";

import type { FooterItem, NavItem } from "@/constants/navigation";
import { FOOTER_ITEMS, NAV_ITEMS } from "@/constants/navigation";

const navLinkStyles =
  "group flex items-center no-underline text-sm font-medium py-1.5 px-2 rounded-sm " +
  "text-nav-text hover:bg-nav-bg-hover hover:text-nav-text-hover";

const navLinkIconStyles =
  "mr-2 size-[25px] shrink-0 stroke-[1.5] text-nav-icon group-hover:text-nav-text-hover";

function isNavActive(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavLinkItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isNavActive(item.path, pathname);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={clsx(
        navLinkStyles,
        isActive &&
          "bg-nav-active! text-nav-active-text! hover:bg-nav-active! hover:text-nav-active-text!",
      )}
    >
      <Icon
        className={clsx(
          navLinkIconStyles,
          isActive && "text-nav-active-text! group-hover:text-nav-active-text!",
        )}
        stroke={1.5}
      />
      <span>{item.label}</span>
    </NavLink>
  );
}

function FooterLinkItem({ item }: { item: FooterItem }) {
  const Icon = item.icon;

  return (
    <a href="#" className={navLinkStyles} onClick={(e) => e.preventDefault()}>
      <Icon className={navLinkIconStyles} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  );
}

export function SidebarNav() {
  const { pathname } = useLocation();

  return (
    <nav className="flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar-bg p-4">
      <div className="flex-1 flex flex-col gap-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.path} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="border-t border-sidebar-border pt-4">
        {FOOTER_ITEMS.map((item) => (
          <FooterLinkItem key={item.label} item={item} />
        ))}
      </div>
    </nav>
  );
}

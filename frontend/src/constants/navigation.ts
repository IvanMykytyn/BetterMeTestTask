import { IconList, IconLogout, IconShoppingCart } from "@tabler/icons-react";

import { ROUTES } from "./routes";

export interface NavItem {
  path: string;
  label: string;
  icon: typeof IconShoppingCart;
}

export const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.ORDERS, label: "Orders", icon: IconShoppingCart },
  { path: ROUTES.PRODUCTS, label: "Products", icon: IconList },
];

export interface FooterItem {
  label: string;
  icon: typeof IconLogout;
  onClick?: () => void;
}

export const FOOTER_ITEMS: FooterItem[] = [
  { label: "Logout", icon: IconLogout },
];

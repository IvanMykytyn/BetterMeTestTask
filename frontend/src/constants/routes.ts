export const ROUTES = {
  HOME: "/",
  ORDERS: "/orders",
  PRODUCTS: "/products",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

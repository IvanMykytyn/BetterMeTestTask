export const QUERY_KEYS = {
  ORDERS: 'orders',
} as const;

export interface OrdersResponse {
  // data: Order[];
  totalPages: number;
}
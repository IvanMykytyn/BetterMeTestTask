export interface Order {
  id: string;
  latitude: number;
  longitude: number;
  subtotal: number;
  composite_tax_rate: number;
  tax_amount: number;
  total_amount: number;
  timestamp: string;
}
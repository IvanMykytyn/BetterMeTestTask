import { useQuery } from '@tanstack/react-query';
import type { Order } from '@/types/order';
import { QUERY_KEYS } from '@/constants/queryKeys';

interface OrdersResponse {
  data: Order[];
  totalPages: number;
}

interface UseOrdersParams {
  search: string;
  page: number;
}

const PAGE_SIZE = 3;


const MOCK_ORDERS: Order[] = [
  {
    "id": "1",
    "latitude": 40.7128,
    "longitude": -74.006,
    "subtotal": 120.50,
    "composite_tax_rate": 0.08875,
    "tax_amount": 10.69,
    "total_amount": 131.19,
    "timestamp": "2026-02-25T12:34:56Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "New York",
    "city": "New York"
  },
  {
    "id": "2",
    "latitude": 40.73061,
    "longitude": -73.935242,
    "subtotal": 75.20,
    "composite_tax_rate": 0.08875,
    "tax_amount": 6.67,
    "total_amount": 81.87,
    "timestamp": "2026-02-25T13:10:22Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Kings",
    "city": "Brooklyn"
  },
  {
    "id": "3",
    "latitude": 40.789142,
    "longitude": -73.13496,
    "subtotal": 200.00,
    "composite_tax_rate": 0.07,
    "tax_amount": 14.00,
    "total_amount": 214.00,
    "timestamp": "2026-02-25T14:05:10Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.01,
    "special_rates": 0.0,
    "state": "NY",
    "county": "Suffolk",
    "city": "Smithtown"
  },
  {
    "id": "4",
    "latitude": 40.6782,
    "longitude": -73.9442,
    "subtotal": 50.75,
    "composite_tax_rate": 0.08875,
    "tax_amount": 4.50,
    "total_amount": 55.25,
    "timestamp": "2026-02-25T15:20:45Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Kings",
    "city": "Brooklyn"
  },
  {
    "id": "5",
    "latitude": 40.8448,
    "longitude": -73.8648,
    "subtotal": 99.99,
    "composite_tax_rate": 0.08875,
    "tax_amount": 8.87,
    "total_amount": 108.86,
    "timestamp": "2026-02-25T16:15:33Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Bronx",
    "city": "Bronx"
  },
  {
    "id": "6",
    "latitude": 40.7282,
    "longitude": -73.7949,
    "subtotal": 130.00,
    "composite_tax_rate": 0.08875,
    "tax_amount": 11.54,
    "total_amount": 141.54,
    "timestamp": "2026-02-25T17:00:00Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Queens",
    "city": "Jamaica"
  },
  {
    "id": "7",
    "latitude": 40.650002,
    "longitude": -73.949997,
    "subtotal": 85.50,
    "composite_tax_rate": 0.08875,
    "tax_amount": 7.59,
    "total_amount": 93.09,
    "timestamp": "2026-02-25T18:10:11Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Kings",
    "city": "Brooklyn"
  },
  {
    "id": "8",
    "latitude": 40.7128,
    "longitude": -73.906,
    "subtotal": 150.00,
    "composite_tax_rate": 0.08875,
    "tax_amount": 13.31,
    "total_amount": 163.31,
    "timestamp": "2026-02-25T19:45:55Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Queens",
    "city": "Flushing"
  },
  {
    "id": "9",
    "latitude": 40.8448,
    "longitude": -73.8648,
    "subtotal": 45.00,
    "composite_tax_rate": 0.08875,
    "tax_amount": 3.99,
    "total_amount": 48.99,
    "timestamp": "2026-02-25T20:12:44Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Bronx",
    "city": "Bronx"
  },
  {
    "id": "10",
    "latitude": 40.6782,
    "longitude": -73.9442,
    "subtotal": 60.00,
    "composite_tax_rate": 0.08875,
    "tax_amount": 5.33,
    "total_amount": 65.33,
    "timestamp": "2026-02-25T21:20:30Z",
    "state_rate": 0.04,
    "county_rate": 0.02,
    "city_rate": 0.025,
    "special_rates": 0.00375,
    "state": "NY",
    "county": "Kings",
    "city": "Brooklyn"
  }
];

export function useOrders({ search, page }: UseOrdersParams) {
  return useQuery<OrdersResponse>({
    queryKey: [QUERY_KEYS.ORDERS, search, page],

    queryFn:  () => {
      let filtered = [...MOCK_ORDERS];

      
      if (search) {
        filtered = filtered.filter((order) =>
          order.city.toLowerCase().includes(search.toLowerCase())
        );
      }

      const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

      const paginated = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
      );

      return {
        data: paginated,
        totalPages,
      };
    },

    
  });
}
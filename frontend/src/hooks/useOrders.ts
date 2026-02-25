import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
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

export function useOrders({ search, page }: UseOrdersParams) {
  return useQuery<OrdersResponse>({
    queryKey: [QUERY_KEYS.ORDERS, search, page],

    queryFn: async () => {
      const response = await api.get('/orders', {
        params: {
          search,
          page,
        },
      });

      return response.data;
    },

    // keepPreviousData: true, 
  });
}
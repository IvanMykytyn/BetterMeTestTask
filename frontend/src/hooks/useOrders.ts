import { useQuery } from '@tanstack/react-query';
import type { Order } from '@/types/order';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { api } from '@/lib/axios';

interface OrdersResponse {
  data: Order[];
  totalPages: number;
}

interface UseOrdersParams {
  search: string;
  page: number;
}

const PAGE_SIZE = 3;

interface ListOrdersApiResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: Order[];
}

export function useOrders({ search, page }: UseOrdersParams) {
  return useQuery<OrdersResponse>({
    queryKey: [QUERY_KEYS.ORDERS, search, page],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: PAGE_SIZE,
      };

      const { data } = await api.get<ListOrdersApiResponse>(
        '/counter/orders/list',
        { params }
      );

      return {
        data: data.results,
        totalPages: data.num_pages,
      };
    },
  });
}
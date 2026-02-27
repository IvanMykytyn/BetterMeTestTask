import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Order } from '@/types/order';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { api } from '@/lib/axios';

interface OrdersResponse {
  data: Order[];
  totalPages: number;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const;

export interface OrdersFilters {
  fromTimestamp?: string;
  toTimestamp?: string;
  minSubtotal?: number;
  maxSubtotal?: number;
  minTotal?: number;
  maxTotal?: number;
  state?: string;
  county?: string;
  city?: string;
}

interface UseOrdersParams {
  search: string;
  page: number;
  pageSize: number;
  filters?: OrdersFilters;
}

interface ListOrdersApiResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: Order[];
}

export function useOrders({ search, page, pageSize, filters }: UseOrdersParams) {
  return useQuery<OrdersResponse>({
    queryKey: [QUERY_KEYS.ORDERS, search, page, pageSize, filters],
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
        search: search ?? undefined,
      };

      if (filters) {
        if (filters.fromTimestamp) params.from_timestamp = filters.fromTimestamp;
        if (filters.toTimestamp) params.to_timestamp = filters.toTimestamp;
        if (filters.minSubtotal != null) params.min_subtotal = filters.minSubtotal;
        if (filters.maxSubtotal != null) params.max_subtotal = filters.maxSubtotal;
        if (filters.minTotal != null) params.min_total = filters.minTotal;
        if (filters.maxTotal != null) params.max_total = filters.maxTotal;
        if (filters.state) params.state = filters.state;
        if (filters.county) params.county = filters.county;
        if (filters.city) params.city = filters.city;
      }

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
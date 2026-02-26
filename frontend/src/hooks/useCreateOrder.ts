import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { CreateOrderFormData } from '@/components/orders/CreateOrderModal';

interface CreateOrderPayload {
  latitude: number;
  longitude: number;
  subtotal: number;
  timestamp?: string;
}

interface CreateOrderResponse {
  id: number;
  timestamp: string;
}

function formatOrderDate(date: string | Date | undefined): string | undefined {
  if (!date) return undefined;
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return `${dateStr} 00:00:00`;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CreateOrderFormData) => {
      const payload: CreateOrderPayload = {
        latitude: formData.latitude,
        longitude: formData.longitude,
        subtotal: formData.subtotal,
      };
      const timestamp = formatOrderDate(formData.orderDate);
      if (timestamp) {
        payload.timestamp = timestamp;
      }

      const { data } = await api.post<CreateOrderResponse>(
        '/counter/orders',
        payload
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

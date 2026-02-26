import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { notifications } from "@mantine/notifications";

interface UploadOrdersFileResponse {
  message: string;
}

export interface UploadOrdersFileInput {
  file: File;
  onProgress?: (progress: number) => void;
}

export function useUploadOrdersFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, onProgress }: UploadOrdersFileInput) => {
      const formData = new FormData();
      formData.append("orders_file", file);
      const response = await api.post<UploadOrdersFileResponse>(
        "/counter/orders/import",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress?.(progress);
            }
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      notifications.show({
        title: "Orders uploaded successfully",
        message: data.message,
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Error uploading orders",
        message: error.message,
        color: "red",
      });
    },
  });
}

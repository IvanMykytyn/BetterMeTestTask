import { useState } from "react";
import { useOrders, PAGE_SIZE_OPTIONS } from "@/hooks/useOrders";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import OrdersTable from "./OrdersTable";
import {
  Alert,
  Box,
  LoadingOverlay,
  TextInput,
  Select,
  Text,
  Title,
  Pagination,
} from "@mantine/core";
import { Button } from "../shared/Button";
import { CreateOrderModal } from "./modals/CreateOrderModal";
import { ImportOrdersModal } from "./modals/ImportOrdersModal";
import { IconSearch } from "@tabler/icons-react";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const { data, isFetching, isError, error, refetch } = useOrders({ search, page, pageSize });
  const createOrder = useCreateOrder();
  const totalPages = data?.totalPages ?? 0;


  return (
    <div className="mt-2">
      <div className="mb-4">
        <Title order={2}>Orders</Title>
      </div>

      <div className="flex justify-between items-center gap-4 mb-4">
        <TextInput
          placeholder="Search by city..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          w={250}
        />
        <div className="flex items-center gap-2">
          <Button variant="light" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>Create Order</Button>
        </div>
      </div>

      <CreateOrderModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => {
          createOrder.mutate(data);
        }}
      />

      <ImportOrdersModal opened={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {isError ? (
        <Alert color="red" title="Failed to load orders" variant="light">
          <Text size="sm" mb="sm">
            {error instanceof Error ? error.message : "Something went wrong. Please try again."}
          </Text>
          <Button variant="light" size="xs" onClick={() => void refetch()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <Box pos="relative" style={{ minHeight: 200 }}>
          <LoadingOverlay visible={isFetching} zIndex={1000} />
          <OrdersTable orders={data?.data ?? []} />
          <div className="flex justify-between items-center gap-4 px-2 mt-4">
            {totalPages > 1 && <Pagination total={totalPages} value={page} onChange={setPage} />}
            <Select
              label=""
              value={String(pageSize)}
              onChange={(value) => {
                const size = value ? Number(value) : 10;
                setPageSize(size);
                setPage(1);
              }}
              data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
              w={80}
            />
          </div>
        </Box>
      )}
    </div>
  );
}

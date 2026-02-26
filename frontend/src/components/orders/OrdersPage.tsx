import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import OrdersTable from "./OrdersTable";
import OrdersToolbar from "./OrdersToolbar";
import OrdersPagination from "./OrdersPagination";
import { OrderFileDropzone } from "./OrderFileDropzone";
import { Group, Modal } from "@mantine/core";
import { Button } from "../shared/Button";
import { CreateOrderModal, type CreateOrderFormData } from "./CreateOrderModal";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data, isLoading } = useOrders({ search, page });

  return (
    <>
      <OrdersToolbar
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <Group mb="md">
        <Button onClick={() => setIsCreateOpen(true)}>Create Order</Button>
        <Button variant="light" onClick={() => setIsImportOpen(true)}>
          Import CSV
        </Button>
      </Group>

      <CreateOrderModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data: CreateOrderFormData) => {
          console.log("Order created:", data);
          setIsCreateOpen(false);
        }}
      />

      <Modal
        opened={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Upload CSV"
        size="md"
        padding="xl"
        radius="md"
      >
        <OrderFileDropzone value={importFile} onChange={setImportFile} />
        <Group mt="md">
          <Button variant="default" onClick={() => setIsImportOpen(false)}>
            Cancel
          </Button>
          <Button>Upload</Button>
        </Group>
      </Modal>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <OrdersTable orders={data?.data ?? []} />
          <OrdersPagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}

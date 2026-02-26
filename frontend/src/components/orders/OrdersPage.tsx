import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import OrdersTable from "./OrdersTable";
import OrdersToolbar from "./OrdersToolbar";
import OrdersPagination from "./OrdersPagination";
import { CreateOrderModal } from "./CreateOrderModal";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      
      <CreateOrderModal
        onClose={() => {}}
        onSubmit={(data) => {
          console.log("Order created:", data);
        }}
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <OrdersTable orders={data?.data ?? []} />
          <OrdersPagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}

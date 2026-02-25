"use client";

import { useState } from "react";
// import OrdersToolbar from "./OrdersToolbar";
// Через те що поки нема
import { useOrders } from "@/hooks/useOrders";
import { OrdersTable } from "./OrdersTable";
import { OrdersPagination } from "./OrdersPagination";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({ search, page });

  return (
    <div>
      <OrdersToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <OrdersTable orders={data?.data ?? []} isLoading={isLoading} />

      <OrdersPagination
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}

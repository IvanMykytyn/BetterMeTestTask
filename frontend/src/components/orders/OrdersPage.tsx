"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import OrdersTable from "./OrdersTable";
import OrdersToolbar from "./OrdersToolbar";
import OrdersPagination from "./OrdersPagination";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({ search, page });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <>
      <OrdersToolbar
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <OrdersTable orders={data.data} />

      <OrdersPagination
        page={page}
        totalPages={data.totalPages}
        onChange={setPage}
      />
    </>
  );
}

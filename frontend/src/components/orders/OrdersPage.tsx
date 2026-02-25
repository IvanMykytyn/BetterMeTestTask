"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import OrdersToolbar from "./OrdersToolbar";
import OrdersTable from "./OrdersTable";
import OrdersPagination from "./OrdersPagination";
import { Order } from "@/types/order";

interface OrdersResponse {
  data: Order[];
  totalPages: number;
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders", search, page],
    queryFn: async () => {
      const res = await fetch(`/api/orders?search=${search}&page=${page}`);
      return res.json();
    },
  });

  return (
    <div>
      <OrdersToolbar search={search} onSearchChange={setSearch} />

      <OrdersTable orders={data?.data || []} isLoading={isLoading} />

      <OrdersPagination
        currentPage={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}

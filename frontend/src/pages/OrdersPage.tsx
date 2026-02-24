import { Title } from "@mantine/core";

import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { ImportOrders } from "@/components/orders/ImportOrders";
import { OrdersFilter } from "@/components/orders/OrdersFilter";
import { OrdersTable } from "@/components/orders/OrdersTable";

export function OrdersPage() {
  return (
    <div>
      <Title order={1}>Orders</Title>
      <OrdersFilter />
      <OrdersTable />
      <CreateOrderModal />
      <ImportOrders />
    </div>
  );
}

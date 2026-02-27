import { useState } from "react";
import { Box, Table } from "@mantine/core";
import type { Order } from "@/types/order";
import { formatCurrency, formatRate } from "@/utils/format";

interface Props {
  orders: Order[];
}

export default function OrdersTable({ orders }: Props) {
  const [sortBy, setSortBy] = useState<keyof Order | null>(null);
  const [reversed, setReversed] = useState(false);

  const sorted = [...orders].sort((a, b) => {
    if (!sortBy) return 0;

    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return reversed ? bVal - aVal : aVal - bVal;
    }

    return reversed
      ? String(bVal).localeCompare(String(aVal))
      : String(aVal).localeCompare(String(bVal));
  });

  const handleSort = (field: keyof Order) => {
    const isReversed = field === sortBy ? !reversed : false;
    setSortBy(field);
    setReversed(isReversed);
  };

  return (
    <Box style={{ overflow: "auto" }}>
      <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th onClick={() => handleSort("id")}>ID</Table.Th>
          <Table.Th onClick={() => handleSort("timestamp")}>Date</Table.Th>
          <Table.Th onClick={() => handleSort("state")} style={{ whiteSpace: "nowrap" }}>State</Table.Th>
          <Table.Th onClick={() => handleSort("city")} style={{ whiteSpace: "nowrap" }}>City</Table.Th>
          <Table.Th onClick={() => handleSort("county")} style={{ whiteSpace: "nowrap" }}>County</Table.Th>

          <Table.Th onClick={() => handleSort("subtotal")}>Subtotal</Table.Th>

          <Table.Th onClick={() => handleSort("tax_amount")}>Tax</Table.Th>

          <Table.Th onClick={() => handleSort("total_amount")}>Total</Table.Th>

          <Table.Th onClick={() => handleSort("composite_tax_rate")}>Composite Rate</Table.Th>

          <Table.Th onClick={() => handleSort("state_rate")}>State Rate</Table.Th>

          <Table.Th onClick={() => handleSort("county_rate")}>County Rate</Table.Th>

          <Table.Th onClick={() => handleSort("city_rate")}>City Rate</Table.Th>

          <Table.Th onClick={() => handleSort("special_rates")}>Special Rate</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {sorted.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={12} ta="center" py="xl" c="dimmed">
              No orders found
            </Table.Td>
          </Table.Tr>
        ) : (
          sorted.map((order) => (
            <Table.Tr key={order.id}>
              <Table.Td>{order.id}</Table.Td>
              <Table.Td>{new Date(order.timestamp).toLocaleDateString("en-US")}</Table.Td>
            <Table.Td style={{ whiteSpace: "nowrap" }}>{order.state}</Table.Td>
            <Table.Td style={{ whiteSpace: "nowrap" }}>{order.city}</Table.Td>
            <Table.Td style={{ whiteSpace: "nowrap" }}>{order.county}</Table.Td>

              <Table.Td>{formatCurrency(order.subtotal)}</Table.Td>
              <Table.Td>{formatCurrency(order.tax_amount)}</Table.Td>
              <Table.Td>{formatCurrency(order.total_amount)}</Table.Td>

              <Table.Td>{formatRate(order.composite_tax_rate)}</Table.Td>
              <Table.Td>{formatRate(order.state_rate)}</Table.Td>
              <Table.Td>{formatRate(order.county_rate)}</Table.Td>
              <Table.Td>{formatRate(order.city_rate)}</Table.Td>
              <Table.Td>{formatRate(order.special_rates)}</Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
    </Box>
  );
}

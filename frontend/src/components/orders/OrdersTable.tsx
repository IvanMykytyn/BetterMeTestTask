import { useState } from "react";
import { Table } from "@mantine/core";
import type { Order } from "@/types/order";

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
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th onClick={() => handleSort("id")}>ID</Table.Th>
          <Table.Th onClick={() => handleSort("city")}>City</Table.Th>
          <Table.Th onClick={() => handleSort("subtotal")}>Subtotal</Table.Th>
          <Table.Th onClick={() => handleSort("total_amount")}>Total</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {sorted.map((order) => (
          <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.city}</Table.Td>
            <Table.Td>${order.subtotal.toFixed(2)}</Table.Td>
            <Table.Td>${order.total_amount.toFixed(2)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

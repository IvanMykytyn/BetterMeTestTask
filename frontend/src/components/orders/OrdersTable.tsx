import { useState } from "react";
import { Table } from "@mantine/core";
import type { Order } from "@/types/order";

interface Props {
  orders: Order[];
}

export default function OrdersTable({ orders }: Props) {
  const [sortBy, setSortBy] = useState<keyof Order | null>(null);
  const [reversed, setReversed] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const formatRate = (value: number) => value.toFixed(5);

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

          <Table.Th onClick={() => handleSort("tax_amount")}>Tax</Table.Th>

          <Table.Th onClick={() => handleSort("total_amount")}>Total</Table.Th>

          <Table.Th onClick={() => handleSort("composite_tax_rate")}>
            Composite Rate
          </Table.Th>

          <Table.Th onClick={() => handleSort("state_rate")}>
            State Rate
          </Table.Th>

          <Table.Th onClick={() => handleSort("county_rate")}>
            County Rate
          </Table.Th>

          <Table.Th onClick={() => handleSort("city_rate")}>City Rate</Table.Th>

          <Table.Th onClick={() => handleSort("special_rates")}>
            Special Rate
          </Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {sorted.map((order) => (
          <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.city}</Table.Td>

            <Table.Td>{formatCurrency(order.subtotal)}</Table.Td>
            <Table.Td>{formatCurrency(order.tax_amount)}</Table.Td>
            <Table.Td>{formatCurrency(order.total_amount)}</Table.Td>

            <Table.Td>{formatRate(order.composite_tax_rate)}</Table.Td>
            <Table.Td>{formatRate(order.state_rate)}</Table.Td>
            <Table.Td>{formatRate(order.county_rate)}</Table.Td>
            <Table.Td>{formatRate(order.city_rate)}</Table.Td>
            <Table.Td>{formatRate(order.special_rates)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

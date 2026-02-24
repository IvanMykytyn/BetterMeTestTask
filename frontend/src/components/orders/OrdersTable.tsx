import { Table } from "@mantine/core";

export function OrdersTable() {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Order</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>—</Table.Td>
          <Table.Td>—</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}

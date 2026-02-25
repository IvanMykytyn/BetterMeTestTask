import type { Order } from "@/types/order";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";

interface Props {
  orders: Order[];
  isLoading: boolean;
}

export function OrdersTable({ orders, isLoading }: Props) {
  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <Table>
      <TableCaption>List of wellness kit orders</TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>Tax</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Tax Rate</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No orders found
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>

              <TableCell>${order.subtotal.toFixed(2)}</TableCell>

              <TableCell>${order.tax_amount.toFixed(2)}</TableCell>

              <TableCell>${order.total_amount.toFixed(2)}</TableCell>

              <TableCell>{order.composite_tax_rate}</TableCell>

              <TableCell className="text-right">
                {new Date(order.timestamp).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

import type { OrdersFilters } from "@/hooks/useOrders";

export const FILTER_LABELS: Record<keyof OrdersFilters, string> = {
  fromTimestamp: "From date",
  toTimestamp: "To date",
  minSubtotal: "Min subtotal",
  maxSubtotal: "Max subtotal",
  minTotal: "Min total",
  maxTotal: "Max total",
  state: "State",
  county: "County",
  city: "City",
};

export function formatFilterValue(
  key: keyof OrdersFilters,
  value: string | number | undefined
): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    return key.includes("subtotal") || key.includes("Total")
      ? `$${value.toFixed(2)}`
      : String(value);
  }
  if (key === "fromTimestamp" || key === "toTimestamp") {
    try {
      return new Date(value).toLocaleDateString("en-US");
    } catch {
      return value;
    }
  }
  return value;
}

export function dateToTimestamp(date: Date | null, endOfDay: boolean): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const time = endOfDay ? "23:59:59" : "00:00:00";
  return `${dateStr} ${time}`;
}

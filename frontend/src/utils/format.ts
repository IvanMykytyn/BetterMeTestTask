export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export const formatRate = (value: number) => (value === 0 ? "-" : value.toFixed(5));

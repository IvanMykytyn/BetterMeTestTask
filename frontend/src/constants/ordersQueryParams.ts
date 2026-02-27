import {
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import type { OrdersFilters } from "@/hooks/useOrders";

export const ORDERS_QUERY_PARAMS = {
  search: withDefault(StringParam, ""),
  page: withDefault(NumberParam, 1),
  pageSize: withDefault(NumberParam, 10),
  fromTimestamp: StringParam,
  toTimestamp: StringParam,
  minSubtotal: NumberParam,
  maxSubtotal: NumberParam,
  minTotal: NumberParam,
  maxTotal: NumberParam,
  state: StringParam,
  county: StringParam,
  city: StringParam,
} as const;

export type OrdersQueryParams = {
  search: string;
  page: number;
  pageSize: number;
  fromTimestamp: string | null | undefined;
  toTimestamp: string | null | undefined;
  minSubtotal: number | null | undefined;
  maxSubtotal: number | null | undefined;
  minTotal: number | null | undefined;
  maxTotal: number | null | undefined;
  state: string | null | undefined;
  county: string | null | undefined;
  city: string | null | undefined;
};

export function queryParamsToFilters(params: OrdersQueryParams): OrdersFilters {
  const filters: OrdersFilters = {};
  if (params.fromTimestamp) filters.fromTimestamp = params.fromTimestamp;
  if (params.toTimestamp) filters.toTimestamp = params.toTimestamp;
  if (params.minSubtotal != null && !Number.isNaN(params.minSubtotal))
    filters.minSubtotal = params.minSubtotal;
  if (params.maxSubtotal != null && !Number.isNaN(params.maxSubtotal))
    filters.maxSubtotal = params.maxSubtotal;
  if (params.minTotal != null && !Number.isNaN(params.minTotal))
    filters.minTotal = params.minTotal;
  if (params.maxTotal != null && !Number.isNaN(params.maxTotal))
    filters.maxTotal = params.maxTotal;
  if (params.state) filters.state = params.state;
  if (params.county) filters.county = params.county;
  if (params.city) filters.city = params.city;
  return filters;
}

import type { OrdersFilters } from "@/hooks/useOrders";
import { dateToTimestamp } from "./filters";

export interface OrdersFiltersDraft {
  fromDate: Date | null;
  toDate: Date | null;
  minSubtotal: string;
  maxSubtotal: string;
  minTotal: string;
  maxTotal: string;
  state: string;
  county: string;
  city: string;
}

export const EMPTY_FILTERS_DRAFT: OrdersFiltersDraft = {
  fromDate: null,
  toDate: null,
  minSubtotal: "",
  maxSubtotal: "",
  minTotal: "",
  maxTotal: "",
  state: "",
  county: "",
  city: "",
};

export function draftToApplied(draft: OrdersFiltersDraft): OrdersFilters {
  const filters: OrdersFilters = {};
  const fromTs = dateToTimestamp(draft.fromDate, false);
  const toTs = dateToTimestamp(draft.toDate, true);
  if (fromTs) filters.fromTimestamp = fromTs;
  if (toTs) filters.toTimestamp = toTs;
  const minSub = parseFloat(draft.minSubtotal);
  const maxSub = parseFloat(draft.maxSubtotal);
  const minTot = parseFloat(draft.minTotal);
  const maxTot = parseFloat(draft.maxTotal);
  if (!Number.isNaN(minSub)) filters.minSubtotal = minSub;
  if (!Number.isNaN(maxSub)) filters.maxSubtotal = maxSub;
  if (!Number.isNaN(minTot)) filters.minTotal = minTot;
  if (!Number.isNaN(maxTot)) filters.maxTotal = maxTot;
  if (draft.state.trim()) filters.state = draft.state.trim();
  if (draft.county.trim()) filters.county = draft.county.trim();
  if (draft.city.trim()) filters.city = draft.city.trim();
  return filters;
}

export function appliedToDraft(applied: OrdersFilters): OrdersFiltersDraft {
  const draft = { ...EMPTY_FILTERS_DRAFT };
  if (applied.fromTimestamp) {
    try {
      draft.fromDate = new Date(applied.fromTimestamp);
    } catch {
      draft.fromDate = null;
    }
  }
  if (applied.toTimestamp) {
    try {
      draft.toDate = new Date(applied.toTimestamp);
    } catch {
      draft.toDate = null;
    }
  }
  if (applied.minSubtotal != null) draft.minSubtotal = String(applied.minSubtotal);
  if (applied.maxSubtotal != null) draft.maxSubtotal = String(applied.maxSubtotal);
  if (applied.minTotal != null) draft.minTotal = String(applied.minTotal);
  if (applied.maxTotal != null) draft.maxTotal = String(applied.maxTotal);
  if (applied.state) draft.state = applied.state;
  if (applied.county) draft.county = applied.county;
  if (applied.city) draft.city = applied.city;
  return draft;
}

import { useState, useCallback, useEffect } from "react";
import { useQueryParams } from "use-query-params";
import { useDebouncedValue } from "@mantine/hooks";
import { useOrders, PAGE_SIZE_OPTIONS, type OrdersFilters } from "@/hooks/useOrders";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import OrdersTable from "./OrdersTable";
import {
  Alert,
  Box,
  LoadingOverlay,
  Select,
  Text,
  TextInput,
  Title,
  Pagination,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { Button } from "../shared/Button";
import { CreateOrderModal } from "./modals/CreateOrderModal";
import { ImportOrdersModal } from "./modals/ImportOrdersModal";
import { IconFilter, IconSearch } from "@tabler/icons-react";
import { OrdersFiltersSection } from "./OrdersFiltersSection";
import { EMPTY_FILTERS_DRAFT, draftToApplied, appliedToDraft } from "@/utils/ordersFilters";
import {
  ORDERS_QUERY_PARAMS,
  queryParamsToFilters,
  type OrdersQueryParams,
} from "@/constants/ordersQueryParams";

const FILTER_KEYS = [
  "fromTimestamp",
  "toTimestamp",
  "minSubtotal",
  "maxSubtotal",
  "minTotal",
  "maxTotal",
  "state",
  "county",
  "city",
] as const;

export default function OrdersPage() {
  const [query, setQuery] = useQueryParams(ORDERS_QUERY_PARAMS);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const search = query.search ?? "";

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);
  
  useEffect(() => {
    setQuery({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, setQuery]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filtersDraft, setFiltersDraft] = useState(EMPTY_FILTERS_DRAFT);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const appliedFilters = queryParamsToFilters(query);
  const hasFilters = Object.keys(appliedFilters).length > 0;

  const { data, isFetching, isError, error, refetch } = useOrders({
    search,
    page,
    pageSize,
    filters: hasFilters ? appliedFilters : undefined,
  });

  const handleApplyFilters = useCallback(() => {
    const filters = draftToApplied(filtersDraft);
    setQuery({
      ...filters,
      page: 1,
    });
  }, [filtersDraft, setQuery]);

  const handleResetFilters = useCallback(() => {
    const clear: Partial<OrdersQueryParams> = { page: 1, search: undefined };
    for (const key of FILTER_KEYS) {
      clear[key] = undefined;
    }
    setQuery(clear);
    setFiltersDraft(EMPTY_FILTERS_DRAFT);
    setSearchInput("");
  }, [setQuery]);

  const handleToggleFilters = useCallback(() => {
    const willOpen = !isFiltersOpen;
    if (willOpen && hasFilters) {
      setFiltersDraft(appliedToDraft(appliedFilters));
    }
    setIsFiltersOpen(willOpen);
  }, [isFiltersOpen, hasFilters, appliedFilters]);

  const handleRemoveFilter = useCallback(
    (key: keyof OrdersFilters) => {
      setQuery({ [key]: undefined, page: 1 });
      setFiltersDraft((prev) => {
        const next = { ...prev };
        if (key === "fromTimestamp") next.fromDate = null;
        else if (key === "toTimestamp") next.toDate = null;
        else if (key === "minSubtotal") next.minSubtotal = "";
        else if (key === "maxSubtotal") next.maxSubtotal = "";
        else if (key === "minTotal") next.minTotal = "";
        else if (key === "maxTotal") next.maxTotal = "";
        else if (key === "state") next.state = "";
        else if (key === "county") next.county = "";
        else if (key === "city") next.city = "";
        return next;
      });
    },
    [setQuery]
  );

  const createOrder = useCreateOrder();
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="mt-2">
      <div className="mb-4">
        <Title order={2}>Orders</Title>
      </div>

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="Search by city..."
            leftSection={<IconSearch size={16} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            w={250}
          />
          <Tooltip label={isFiltersOpen ? "Hide filters" : "Show filters"}>
            <ActionIcon
              variant={isFiltersOpen ? "filled" : "light"}
              size="lg"
              onClick={handleToggleFilters}
              aria-label="Toggle filters"
            >
              <IconFilter size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="light" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>Create Order</Button>
        </div>
      </div>

      <CreateOrderModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => {
          createOrder.mutate(data);
        }}
      />

      <ImportOrdersModal opened={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <OrdersFiltersSection
        opened={isFiltersOpen}
        draft={filtersDraft}
        onDraftChange={setFiltersDraft}
        applied={appliedFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onCollapse={() => setIsFiltersOpen(false)}
        onRemoveFilter={handleRemoveFilter}
      />

      {isError ? (
        <Alert color="red" title="Failed to load orders" variant="light">
          <Text size="sm" mb="sm">
            {error instanceof Error ? error.message : "Something went wrong. Please try again."}
          </Text>
          <Button variant="light" size="xs" onClick={() => void refetch()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <Box pos="relative" style={{ minHeight: 200 }}>
          <LoadingOverlay visible={isFetching} zIndex={1000} />
          <OrdersTable orders={data?.data ?? []} />
          <div className="flex justify-between items-center gap-4 px-2 mt-4">
            {totalPages > 1 && (
              <>
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={(p) => setQuery({ page: p })}
                />
                <Select
                  label=""
                  value={String(pageSize)}
                  onChange={(value) => {
                    const size = value ? Number(value) : 10;
                    setQuery({ pageSize: size, page: 1 });
                  }}
                  data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
                  w={80}
                />
              </>
            )}
          </div>
        </Box>
      )}
    </div>
  );
}

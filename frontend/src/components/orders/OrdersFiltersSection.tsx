import {
  Box,
  Collapse,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  TextInput,
  Badge,
  ActionIcon,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import { IconX } from "@tabler/icons-react";
import { Button } from "../shared/Button";
import type { OrdersFilters } from "@/hooks/useOrders";
import type { OrdersFiltersDraft } from "@/utils/ordersFilters";
import { FILTER_LABELS, formatFilterValue } from "@/utils/filters";

interface Props {
  opened: boolean;
  draft: OrdersFiltersDraft;
  onDraftChange: (draft: OrdersFiltersDraft) => void;
  applied: OrdersFilters;
  onApply: () => void;
  onReset: () => void;
  onRemoveFilter: (key: keyof OrdersFilters) => void;
}

export function OrdersFiltersSection({
  opened,
  draft,
  onDraftChange,
  applied,
  onApply,
  onReset,
  onRemoveFilter,
}: Props) {
  const appliedKeys = (Object.keys(applied) as (keyof OrdersFilters)[]).filter(
    (k) => {
      const v = applied[k];
      return v != null && v !== "";
    }
  );

  const updateDraft = (updates: Partial<OrdersFiltersDraft>) => {
    onDraftChange({ ...draft, ...updates });
  };

  return (
    <Box mb="md">
      {appliedKeys.length > 0 && (
        <Group gap="xs" mb="sm" wrap="wrap">
          {appliedKeys.map((key) => (
            <Badge
              key={key}
              variant="light"
              size="md"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  color="gray"
                  onClick={() => onRemoveFilter(key)}
                  aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                >
                  <IconX size={12} />
                </ActionIcon>
              }
            >
              {FILTER_LABELS[key]}: {formatFilterValue(key, applied[key])}
            </Badge>
          ))}
        </Group>
      )}

      <Collapse in={opened}>
        <Box
          p="md"
          style={{ borderRadius: 8, border: "1px solid var(--mantine-color-default-border)" }}
        >
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              <DatePickerInput
                label="From date"
                placeholder="Pick start date"
                value={draft.fromDate as DateValue}
                onChange={(date) =>
                  updateDraft({
                    fromDate: date
                      ? ((date as unknown) instanceof Date
                          ? (date as unknown as Date)
                          : new Date(date))
                      : null,
                  })
                }
                maxDate={draft.toDate ?? undefined}
              />
              <DatePickerInput
                label="To date"
                placeholder="Pick end date"
                value={draft.toDate as DateValue}
                onChange={(date) =>
                  updateDraft({
                    toDate: date
                      ? ((date as unknown) instanceof Date
                          ? (date as unknown as Date)
                          : new Date(date))
                      : null,
                  })
                }
                minDate={draft.fromDate ?? undefined}
              />
              <NumberInput
                label="Min subtotal ($)"
                placeholder="e.g. 10"
                value={draft.minSubtotal}
                onChange={(v) => updateDraft({ minSubtotal: String(v ?? "") })}
                decimalScale={2}
                min={0}
                allowDecimal
              />
              <NumberInput
                label="Max subtotal ($)"
                placeholder="e.g. 1000"
                value={draft.maxSubtotal}
                onChange={(v) => updateDraft({ maxSubtotal: String(v ?? "") })}
                decimalScale={2}
                min={0}
                allowDecimal
              />
              <NumberInput
                label="Min total ($)"
                placeholder="e.g. 10"
                value={draft.minTotal}
                onChange={(v) => updateDraft({ minTotal: String(v ?? "") })}
                decimalScale={2}
                min={0}
                allowDecimal
              />
              <NumberInput
                label="Max total ($)"
                placeholder="e.g. 5000"
                value={draft.maxTotal}
                onChange={(v) => updateDraft({ maxTotal: String(v ?? "") })}
                decimalScale={2}
                min={0}
                allowDecimal
              />
              <TextInput
                label="State"
                placeholder="e.g. CA"
                value={draft.state}
                onChange={(e) => updateDraft({ state: e.currentTarget.value })}
              />
              <TextInput
                label="County"
                placeholder="e.g. Los Angeles"
                value={draft.county}
                onChange={(e) => updateDraft({ county: e.currentTarget.value })}
              />
              <TextInput
                label="City"
                placeholder="e.g. San Francisco"
                value={draft.city}
                onChange={(e) => updateDraft({ city: e.currentTarget.value })}
              />
            </SimpleGrid>

            <Group gap="sm">
              <Button onClick={onApply}>Apply filters</Button>
              <Button variant="default" onClick={onReset}>
                Reset filters
              </Button>
            </Group>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

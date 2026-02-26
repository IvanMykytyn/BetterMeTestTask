import { Divider, Group, Modal, NumberInput, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { MapPicker } from "../../shared/MapPicker";
import { Button } from "../../shared/Button";

const createOrderSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, "Must be between -90 and 90")
    .max(90, "Must be between -90 and 90"),
  longitude: z.coerce
    .number()
    .min(-180, "Must be between -180 and 180")
    .max(180, "Must be between -180 and 180"),
  subtotal: z.coerce.number().min(0, "Must be positive"),
  orderDate: z.string().optional(),
  file: z.any().optional(),
});

export type CreateOrderFormData = z.output<typeof createOrderSchema>;

type Props = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderFormData) => void;
};

export function CreateOrderModal({ opened, onClose, onSubmit }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema) as Resolver<CreateOrderFormData>,
    defaultValues: {
      latitude: undefined,
      longitude: undefined,
      subtotal: undefined,
      orderDate: new Date().toISOString().slice(0, 10),
      file: undefined,
    },
  });

  const latitude = useWatch({ control, name: "latitude", defaultValue: undefined });
  const longitude = useWatch({ control, name: "longitude", defaultValue: undefined });
  const [debouncedCoords] = useDebouncedValue(
    { lat: latitude, lng: longitude },
    1000
  );

  const handleCoordinatesChange = useCallback(
    (lat: number, lng: number) => {
      setValue("latitude", lat, { shouldValidate: true });
      setValue("longitude", lng, { shouldValidate: true });
    },
    [setValue]
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = (data: CreateOrderFormData) => {
    onSubmit(data);
    handleClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create Order"
      size="lg"
      padding="xl"
      radius="md"
      styles={{
        header: { padding: "24px 32px" },
        title: { fontSize: "1.25rem", fontWeight: 600 },
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onFormSubmit)(e);
        }}
      >
        <Stack gap="lg">
          <Stack gap="md">
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              flyToLatitude={debouncedCoords.lat}
              flyToLongitude={debouncedCoords.lng}
              onCoordinatesChange={handleCoordinatesChange}
            />

            <div className="flex gap-2 w-full">
              <Controller
                name="latitude"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    label="Latitude"
                    placeholder="e.g. 40.7128"
                    decimalScale={6}
                    className="flex-1"
                    error={errors.latitude?.message}
                    allowDecimal
                  />
                )}
              />

              <Controller
                name="longitude"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    label="Longitude"
                    placeholder="e.g. -74.006"
                    decimalScale={6}
                    className="flex-1"
                    error={errors.longitude?.message}
                    allowDecimal
                  />
                )}
              />
            </div>

            <Controller
              name="subtotal"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="Subtotal"
                  placeholder="e.g. 99.99"
                  decimalScale={2}
                  prefix="$"
                  error={errors.subtotal?.message}
                  allowDecimal
                />
              )}
            />

            <Controller
              name="orderDate"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label="Order date"
                  placeholder="Pick date"
                  value={field.value ?? null}
                  onChange={(date) => field.onChange(date ?? undefined)}
                  maxDate={new Date()}
                  error={errors.orderDate?.message}
                />
              )}
            />
          </Stack>

          <Divider />

          <Group gap="sm" justify="center">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

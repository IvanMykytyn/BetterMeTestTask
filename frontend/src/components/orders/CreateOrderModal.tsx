import { Divider, Group, Modal, NumberInput, Stack } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../shared/Button";

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
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema) as Resolver<CreateOrderFormData>,
    defaultValues: {
      latitude: undefined,
      longitude: undefined,
      subtotal: undefined,
      file: undefined,
    },
  });

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
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="Latitude"
                  placeholder="e.g. 40.7128"
                  decimalScale={6}
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
                  error={errors.longitude?.message}
                  allowDecimal
                />
              )}
            />

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
          </Stack>

          <Divider />

          <Group gap="sm">
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

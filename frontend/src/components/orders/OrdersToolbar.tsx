import { Group, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

export default function OrdersToolbar({ search, setSearch }: Props) {
  return (
    <Group justify="flex-start" mb="md">
      <TextInput
        placeholder="Search by city..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        w={250}
      />
    </Group>
  );
}

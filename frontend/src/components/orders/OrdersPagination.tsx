import { Center, Pagination } from "@mantine/core";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function OrdersPagination({
  page,
  totalPages,
  onChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <Center mt="md">
      <Pagination total={totalPages} value={page} onChange={onChange} />
    </Center>
  );
}

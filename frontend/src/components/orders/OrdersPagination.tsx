import { Pagination } from "@mantine/core";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function OrdersPagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <Pagination
      value={currentPage}
      onChange={onPageChange}
      total={totalPages}
      mt="md"
    />
  );
}

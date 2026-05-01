import { Button, Flex, Text } from "@radix-ui/themes";

type ModelsPaginationProps = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  totalPages?: number;
};

export function ModelsPagination({
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrevious,
  page,
  totalPages
}: ModelsPaginationProps) {
  if (!hasNextPage && !hasPreviousPage) return null;

  const pageLabel = totalPages != null && totalPages > 1
    ? `Page ${page} of ${totalPages}`
    : `Page ${page}`;

  return (
    <Flex align="center" justify="center" gap="3" pt="4">
      <Button variant="soft" color="gray" size="1" disabled={!hasPreviousPage} onClick={onPrevious}>
        ← Prev
      </Button>
      <Text size="1" color="gray" style={{ minWidth: 80, textAlign: "center" }}>
        {pageLabel}
      </Text>
      <Button variant="soft" color="gray" size="1" disabled={!hasNextPage} onClick={onNext}>
        Next →
      </Button>
    </Flex>
  );
}

import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { Badge, Button, Flex, Text } from "@radix-ui/themes";
import { CloseIcon } from "@code-code/console-web-ui";
import { vendorLookupKey } from "../vendor-index";
import { CATEGORY_OPTIONS } from "./model-detail-formatters";
import { sourceOptionLabel } from "./model-table-filter-options";

type ModelActiveFiltersProps = {
  onCategoryClear: () => void;
  onClearAll: () => void;
  onModelQueryClear: () => void;
  onSourceRemove: (id: string) => void;
  onVendorRemove: (id: string) => void;
  modelQuery: string;
  selectedCategory: string;
  sourceIds: string[];
  vendorIds: string[];
  vendorsById: Record<string, Vendor>;
};

export function ModelActiveFilters({
  onCategoryClear,
  onClearAll,
  onModelQueryClear,
  onSourceRemove,
  onVendorRemove,
  modelQuery,
  selectedCategory,
  sourceIds,
  vendorIds,
  vendorsById,
}: ModelActiveFiltersProps) {
  const normalizedQuery = modelQuery.trim();
  const categoryLabel = categoryOptionLabel(selectedCategory);
  const hasFilters = vendorIds.length > 0 || sourceIds.length > 0 || selectedCategory !== "" || normalizedQuery !== "";
  if (!hasFilters) return null;

  return (
    <Flex align="center" gap="2" wrap="wrap" mb="3">
      <Text color="gray" size="1">Filters:</Text>
      {normalizedQuery !== "" ? (
        <FilterChip label={`Search: ${normalizedQuery}`} onRemove={onModelQueryClear} />
      ) : null}
      {selectedCategory !== "" ? (
        <FilterChip label={`Category: ${categoryLabel}`} onRemove={onCategoryClear} />
      ) : null}
      {vendorIds.map((id) => {
        const label = vendorsById[vendorLookupKey(id)]?.vendor?.displayName || id;
        return (
          <FilterChip key={id} label={label} onRemove={() => onVendorRemove(id)} />
        );
      })}
      {sourceIds.map((id) => (
        <FilterChip key={id} label={sourceOptionLabel(id)} onRemove={() => onSourceRemove(id)} />
      ))}
      <Button color="gray" size="1" variant="ghost" onClick={onClearAll}>
        Clear all
      </Button>
    </Flex>
  );
}

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge color="teal" variant="soft" size="1" style={{ alignItems: "center", display: "inline-flex", gap: 4, paddingRight: 4 }}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        style={{ alignItems: "center", background: "none", border: 0, color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}
      >
        <CloseIcon />
      </button>
    </Badge>
  );
}

function categoryOptionLabel(value: string) {
  return CATEGORY_OPTIONS.find((option) => String(option.value) === value)?.label || value;
}

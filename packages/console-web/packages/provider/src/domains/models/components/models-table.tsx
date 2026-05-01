import type { ModelRegistryEntry } from "@code-code/agent-contract/platform/model/v1";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { Box, Button, Table } from "@radix-ui/themes";
import { NoDataCallout } from "@code-code/console-web-ui";
import { vendorLookupKey } from "../vendor-index";
import { ModelRow } from "./model-row";
import { resolveProductInfo } from "../../providers/provider-product-info";
import { ModelsTableHeader } from "./models-table-header";

type ModelsTableProps = {
  models: ModelRegistryEntry[];
  vendorsById: Record<string, Vendor>;
  selectedSourceIds: string[];
  productInfos?: ProductInfo[];
  supportVendors?: Vendor[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export function ModelsTable({ models, vendorsById, productInfos, supportVendors, selectedSourceIds, hasActiveFilters, onClearFilters }: ModelsTableProps) {
  return (
    <Box style={{ overflowX: "auto" }}>
      <Table.Root style={{ minWidth: 840 }}>
        <ModelsTableHeader />
        <Table.Body>
          {models.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <NoDataCallout>
                  {hasActiveFilters
                    ? "No models match your current filters."
                    : "No models found."}
                  {hasActiveFilters && onClearFilters ? (
                    <Box mt="2">
                      <Button size="1" variant="soft" color="gray" onClick={onClearFilters}>
                        Clear all filters
                      </Button>
                    </Box>
                  ) : null}
                </NoDataCallout>
              </Table.Cell>
            </Table.Row>
          ) : (
            models.map((model) => (
              <ModelRow
                key={`${model.definition?.vendorId || "unknown"}:${model.definition?.modelId || "unknown"}`}
                model={model}
                vendor={vendorsById[vendorLookupKey(model.definition?.vendorId || "")]}
                vendorsById={vendorsById}
                productInfos={productInfos}
                supportVendors={supportVendors}
                selectedSourceIds={selectedSourceIds}
              />
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

import { useMemo, type ReactNode } from "react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { AsyncState } from "@code-code/console-web-ui";

import type { CLI, Surface, Vendor } from "@code-code/agent-contract/platform/support/v1";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { providerModel } from "../provider-model";
import type { ProviderWorkflowStatusView } from "../provider-workflow-status-view";
import { ProviderCard } from "./provider-card";

const providerNameCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export type ProviderCardGridProps = {
  providers: ProviderView[];
  clis: CLI[];
  productInfos: ProductInfo[];
  surfaces: Surface[];
  vendors: Vendor[];
  loading: boolean;
  error?: unknown;

  /** Optional heading text. Defaults to "Providers". */
  heading?: string;
  /** Optional subtitle below the heading. */
  subtitle?: string;
  /** Empty state title. */
  emptyTitle?: string;
  /** Slot for header actions (add buttons, refresh quota, etc.). */
  headerActions?: ReactNode;
  /** Slot for callouts between header and grid. */
  headerCallouts?: ReactNode;

  /** When true, cards are display-only: no click, no probe button. */
  readonly?: boolean;
  /** Per-provider workflow status map (keyed by providerId). */
  workflowStatuses?: Record<string, ProviderWorkflowStatusView>;
  /** Provider ID currently running a quota query probe. */
  probingProviderId?: string;
  /** Provider ID currently running a model catalog probe. */
  probingModelCatalogProviderId?: string;
  /** Called when a card is opened (ignored in readonly mode). */
  onOpen?: (provider: ProviderView) => void;
  /** Called when the user requests a quota query probe. */
  onProbeQuotaQuery?: (provider: ProviderView) => void;
  /** Called when the user requests a model catalog probe. */
  onProbeModelCatalog?: (provider: ProviderView) => void;
  /** Called to retry loading on error. */
  onRetry?: () => void;
};

export function ProviderCardGrid({
  providers,
  clis,
  productInfos,
  surfaces,
  vendors,
  loading,
  error,
  heading = "Providers",
  subtitle,
  emptyTitle = "No providers.",
  headerActions,
  headerCallouts,
  readonly = false,
  workflowStatuses,
  probingProviderId,
  probingModelCatalogProviderId,
  onOpen,
  onProbeQuotaQuery,
  onProbeModelCatalog,
  onRetry,
}: ProviderCardGridProps) {
  const sortedProviders = useMemo(
    () => [...providers].sort((left, right) => (
      providerNameCollator.compare(providerModel(left).displayName(), providerModel(right).displayName())
    )),
    [providers],
  );
  const blockingError = error && sortedProviders.length === 0 ? error : undefined;

  return (
    <Box>
      <Flex justify="between" align="start" gap="4" wrap="wrap" mb="4">
        <Flex direction="column" gap="1">
          <Heading size="5">{heading}</Heading>
          {subtitle ? (
            <Text color="gray" size="2">{subtitle}</Text>
          ) : null}
        </Flex>
        {headerActions}
      </Flex>

      {headerCallouts}

      <AsyncState
        loading={loading}
        error={blockingError}
        errorTitle="Failed to load providers."
        onRetry={onRetry}
        isEmpty={sortedProviders.length === 0}
        emptyTitle={emptyTitle}
      >
        <Box
          style={{
            display: "grid",
            gap: "var(--space-3)",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {sortedProviders.map((provider) => (
            <ProviderCard
              key={provider.providerId || providerModel(provider).displayName()}
              provider={provider}
              clis={clis}
              productInfos={productInfos}
              surfaces={surfaces}
              vendors={vendors}
              readonly={readonly}
              workflowStatus={workflowStatuses?.[provider.providerId]}
              isProbingQuotaQuery={probingProviderId === provider.providerId}
              isProbingModelCatalog={probingModelCatalogProviderId === provider.providerId}
              onOpen={onOpen}
              onProbeQuotaQuery={onProbeQuotaQuery}
              onProbeModelCatalog={onProbeModelCatalog}
            />
          ))}
        </Box>
      </AsyncState>
    </Box>
  );
}

import { useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { Flex, Text } from "@radix-ui/themes";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { CLI, Surface } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { SoftBadge, StatusBadge, SurfaceSectionCard } from "@code-code/console-web-ui";
import { VendorAvatar } from "../../models/components/vendor-avatar";
import { useProviderObservability } from "../api";
import { resolveProviderCardOwner } from "../provider-card-capability";
import { resolveProviderCardRenderer } from "../provider-card-registry";
import { useProviderQuotaQueryStatusFromObservability } from "../provider-quota-query-status";
import { providerModel } from "../provider-model";
import { providerSupportsModelCatalogProbe } from "../provider-model-catalog-probe";
import { resolveProductInfo } from "../provider-product-info";
import { resolveProviderQuotaQueryOwner } from "../provider-observability-visualization";
import { providerProductInfoId } from "../provider-support-surface";
import type { ProviderWorkflowStatusView } from "../provider-workflow-status-view";
import { ProviderCustomCard } from "./provider-custom-card";
import { ProbeIcon, ProviderActionIconButton, SearchIcon } from "./provider-model-catalog-editor-icons";

type Props = {
  provider: ProviderView;
  clis: CLI[];
  productInfos: ProductInfo[];
  surfaces: Surface[];
  vendors: Vendor[];
  workflowStatus?: ProviderWorkflowStatusView;
  isProbingQuotaQuery?: boolean;
  isProbingModelCatalog?: boolean;
  readonly?: boolean;
  onOpen?: (provider: ProviderView) => void;
  onProbeQuotaQuery?: (provider: ProviderView) => void;
  onProbeModelCatalog?: (provider: ProviderView) => void;
};

export function ProviderCard({
  provider,
  clis,
  productInfos,
  surfaces,
  vendors,
  workflowStatus,
  isProbingQuotaQuery,
  isProbingModelCatalog,
  readonly = false,
  onOpen,
  onProbeQuotaQuery,
  onProbeModelCatalog,
}: Props) {
  const providerViewModel = providerModel(provider);
  const resolvedProductInfo = resolveProductInfo(providerProductInfoId(provider, vendors, surfaces), productInfos, vendors);
  const displayName = resolvedProductInfo?.displayName || providerViewModel.displayName();
  const authLabel = providerViewModel.authenticationLabel();
  const protocolLabels = providerViewModel.protocolLabels();
  const cardOwner = useMemo(
    () => resolveProviderCardOwner({
      provider,
      clis,
      vendors,
    }),
    [provider, clis, vendors],
  );
  const hasCustomCard = useMemo(
    () => Boolean(resolveProviderCardRenderer(cardOwner)),
    [cardOwner],
  );
  const quotaQueryOwner = useMemo(
    () => resolveProviderQuotaQueryOwner(provider, clis, vendors),
    [provider, clis, vendors],
  );
  const hasQuotaQuery = Boolean(quotaQueryOwner);
  const { detail: statusDetail, isLoading: isStatusLoading, isError: isStatusError } = useProviderObservability(
    hasQuotaQuery ? provider.providerId : undefined,
    "1h",
    "status",
  );
  const { detail: cardDetail, isLoading: isCardLoading, error: cardError } = useProviderObservability(
    hasCustomCard ? provider.providerId : undefined,
    "1h",
    "card",
  );
  const status = useProviderQuotaQueryStatusFromObservability(provider, hasQuotaQuery, {
    detail: statusDetail,
    isLoading: isStatusLoading,
    isError: isStatusError,
  }, quotaQueryOwner) ?? providerViewModel.status();
  const supportsModelCatalogProbe = providerSupportsModelCatalogProbe(provider, surfaces);
  const hasActions = !readonly && (hasQuotaQuery || supportsModelCatalogProbe);

  return (
    <SurfaceSectionCard
      title={(
        <Flex align="center" gap="2" wrap="wrap" style={{ minWidth: 0 }}>
          <VendorAvatar
            displayName={displayName}
            iconUrl={resolvedProductInfo?.iconUrl}
            size="1"
          />
          <Text weight="medium" truncate>{displayName}</Text>
        </Flex>
      )}
      actions={hasActions ? (
        <Flex gap="2" align="center">
          {supportsModelCatalogProbe ? (
            <ProviderActionIconButton
              label="Probe model catalog"
              title={isProbingModelCatalog ? "Probing model catalog" : "Probe model catalog"}
              disabled={Boolean(isProbingModelCatalog)}
              onClick={(event: MouseEvent) => {
                event?.stopPropagation();
                onProbeModelCatalog?.(provider);
              }}
              onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
            >
              <SearchIcon />
            </ProviderActionIconButton>
          ) : null}
          {hasQuotaQuery ? (
            <ProviderActionIconButton
              label="Probe quota query"
              title={isProbingQuotaQuery ? "Probing quota query" : "Probe quota query"}
              disabled={Boolean(isProbingQuotaQuery)}
              onClick={(event: MouseEvent) => {
                event?.stopPropagation();
                onProbeQuotaQuery?.(provider);
              }}
              onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
            >
              <ProbeIcon />
            </ProviderActionIconButton>
          ) : null}
        </Flex>
      ) : null}
      cardSize="2"
      style={readonly ? undefined : { cursor: "pointer" }}
      cardProps={readonly ? undefined : {
        role: "button",
        tabIndex: 0,
        onClick: (event) => {
          if (!isEventFromCurrentTarget(event)) {
            return;
          }
          onOpen?.(provider);
        },
        onKeyDown: (event) => {
          if (!isEventFromCurrentTarget(event)) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen?.(provider);
          }
        },
      }}
    >
      <Flex gap="1" wrap="wrap">
        <SoftBadge color="gray" label={authLabel} />
        {protocolLabels.map((label) => (
          <SoftBadge key={`protocol:${label}`} color="gray" label={label} />
        ))}
      </Flex>
      <ProviderCustomCard
        provider={provider}
        clis={clis}
        vendors={vendors}
        detail={cardDetail}
        isLoading={isCardLoading}
        error={cardError}
        status={hasQuotaQuery ? status : null}
      />
      {workflowStatus ? (
        <Flex align="center" gap="2">
          <StatusBadge color={workflowStatus.color} label={workflowStatus.label} />
          {workflowStatus.reason ? (
            <Text size="1" color="gray" truncate>{workflowStatus.reason}</Text>
          ) : null}
        </Flex>
      ) : null}
    </SurfaceSectionCard>
  );
}

function isEventFromCurrentTarget(event: MouseEvent | KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return false;
  }
  return event.currentTarget.contains(target);
}

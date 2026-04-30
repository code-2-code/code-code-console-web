import { useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { Flex, Text } from "@radix-ui/themes";
import type { CLI } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { SoftBadge, StatusBadge, SurfaceSectionCard } from "@code-code/console-web-ui";
import { VendorAvatar } from "../../models/components/vendor-avatar";
import { useProviderObservability } from "../api";
import { resolveProviderCardOwner } from "../provider-card-capability";
import { resolveProviderCardRenderer } from "../provider-card-registry";
import { useProviderActiveQueryStatusFromObservability } from "../provider-active-query-status";
import { providerModel } from "../provider-model";
import { providerHostTelemetryBadgeLabel, providerHostTelemetryStatus } from "../provider-host-telemetry";
import { resolveProviderActiveQueryOwner } from "../provider-observability-visualization";
import type { ProviderWorkflowStatusView } from "../provider-workflow-status-view";
import { ProviderCustomCard } from "./provider-custom-card";
import { ProbeIcon, ProviderActionIconButton } from "./provider-model-catalog-editor-icons";

type Props = {
  provider: ProviderView;
  clis: CLI[];
  vendors: Vendor[];
  vendorIconUrl?: string;
  workflowStatus?: ProviderWorkflowStatusView;
  isProbingActiveQuery?: boolean;
  readonly?: boolean;
  onOpen?: (provider: ProviderView) => void;
  onProbeActiveQuery?: (provider: ProviderView) => void;
};

export function ProviderCard({
  provider,
  clis,
  onOpen,
  onProbeActiveQuery,
  vendors,
  vendorIconUrl,
  workflowStatus,
  isProbingActiveQuery,
  readonly = false,
}: Props) {
  const providerViewModel = providerModel(provider);
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
  const activeQueryOwner = useMemo(
    () => resolveProviderActiveQueryOwner(provider, clis, vendors),
    [provider, clis, vendors],
  );
  const hasActiveQuery = Boolean(activeQueryOwner);
  const { detail: statusDetail, isLoading: isStatusLoading, isError: isStatusError } = useProviderObservability(
    hasActiveQuery ? provider.providerId : undefined,
    "1h",
    "status",
  );
  const { detail: cardDetail, isLoading: isCardLoading, error: cardError } = useProviderObservability(
    hasCustomCard ? provider.providerId : undefined,
    "1h",
    "card",
  );
  const status = useProviderActiveQueryStatusFromObservability(provider, hasActiveQuery, {
    detail: statusDetail,
    isLoading: isStatusLoading,
    isError: isStatusError,
  }, activeQueryOwner) ?? providerViewModel.status();

  return (
    <SurfaceSectionCard
      title={(
        <Flex align="center" gap="2" wrap="wrap" style={{ minWidth: 0 }}>
          <VendorAvatar
            displayName={providerViewModel.displayName()}
            iconUrl={vendorIconUrl}
            size="1"
          />
          <Text weight="medium" truncate>{providerViewModel.displayName()}</Text>
          <StatusBadge color={status.color} label={status.label} />
        </Flex>
      )}
      actions={!readonly && hasActiveQuery ? (
        <Flex gap="2" align="center">
          <ProviderActionIconButton
            label="Probe active query"
            title={isProbingActiveQuery ? "Probing active query" : "Probe active query"}
            disabled={Boolean(isProbingActiveQuery)}
            onClick={(event: MouseEvent) => {
              event?.stopPropagation();
              onProbeActiveQuery?.(provider);
            }}
            onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
          >
            <ProbeIcon />
          </ProviderActionIconButton>
        </Flex>
      ) : null}
      cardSize="2"
      style={readonly ? undefined : { cursor: "pointer" }}
      cardProps={readonly ? undefined : {
        role: "button",
        tabIndex: 0,
        onClick: () => onOpen?.(provider),
        onKeyDown: (event) => {
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
        {provider.hostTelemetry?.map((item) => {
          const telemetry = providerHostTelemetryStatus(item);
          return (
            <SoftBadge
              key={`${item.scheme}:${item.host}:${item.port}`}
              color={telemetry.color}
              label={providerHostTelemetryBadgeLabel(item)}
            />
          );
        })}
      </Flex>
      <ProviderCustomCard
        provider={provider}
        clis={clis}
        vendors={vendors}
        detail={cardDetail}
        isLoading={isCardLoading}
        error={cardError}
        status={hasActiveQuery ? status : null}
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

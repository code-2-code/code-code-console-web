import { Box, Button, Dialog, Flex, Heading, Text } from "@radix-ui/themes";
import type { ComponentProps } from "react";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { DialogFooterActions, ErrorCalloutIf, SoftBadge, StatusBadge } from "@code-code/console-web-ui";
import { VendorAvatar } from "../../models/components/vendor-avatar";
import { useProviderQuotaQueryStatus } from "../provider-quota-query-status";
import { providerModel } from "../provider-model";
import { ProviderAuthenticationSummary } from "./provider-authentication-summary";
import { ProviderModelBadges } from "./provider-model-badges";
import { SearchIcon } from "./provider-model-catalog-editor-icons";

type Props = {
  provider: ProviderView;
  authenticationKind: ComponentProps<typeof ProviderAuthenticationSummary>["kind"];
  displayName: string;
  iconUrl?: string;
  supportsModelCatalogProbe: boolean;
  supportsQuotaQuery: boolean;
  isProbingModelCatalog: boolean;
  isProbingQuotaQuery: boolean;
  deleteError: string;
  isDeleting: boolean;
  observabilityAuthenticationActionLabel?: string;
  onClose: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onStartAuthentication: () => void;
  onStartObservabilityAuthentication: () => void;
  onProbeModelCatalog: () => void;
  onProbeQuotaQuery: () => void;
  showObservabilityAuthenticationAction?: boolean;
};

export function ProviderDetailsView({
  provider,
  authenticationKind,
  displayName,
  iconUrl,
  supportsModelCatalogProbe,
  supportsQuotaQuery,
  isProbingModelCatalog,
  isProbingQuotaQuery,
  deleteError,
  isDeleting,
  observabilityAuthenticationActionLabel,
  onClose,
  onDelete,
  onStartRename,
  onStartAuthentication,
  onStartObservabilityAuthentication,
  onProbeModelCatalog,
  onProbeQuotaQuery,
  showObservabilityAuthenticationAction,
}: Props) {
  const providerViewModel = providerModel(provider);
  const protocolLabels = providerViewModel.protocolLabels();
  const accountStatus = useProviderQuotaQueryStatus(provider, supportsQuotaQuery) ?? providerViewModel.status();

  return (
    <>
      <Flex justify="between" align="start" mb="4" gap="3">
        <Box>
          <Flex align="center" gap="2">
            <VendorAvatar displayName={displayName} iconUrl={iconUrl} size="2" />
            <Dialog.Title mb="0">{displayName}</Dialog.Title>
          </Flex>
          <Flex align="center" gap="2" wrap="wrap" mt="2">
            <SoftBadge color="gray" label={providerViewModel.authenticationLabel()} />
            {protocolLabels.map((label) => (
              <SoftBadge key={`protocol:${label}`} color="gray" label={label} />
            ))}
            <StatusBadge color={accountStatus?.color || "gray"} label={accountStatus?.label || "Unknown"} />
          </Flex>
          {accountStatus?.reason ? (
            <Text size="1" color="gray" mt="2">
              {accountStatus.reason}
            </Text>
          ) : null}
        </Box>
        <Flex align="center" gap="2">
          <Button size="1" variant="soft" color="gray" onClick={onStartRename}>
            Rename…
          </Button>
        </Flex>
      </Flex>

      <Flex direction="column" gap="4">
        <Box>
          <Heading size="2" mb="1">Models</Heading>
          <ProviderModelBadges models={provider.models} />
          {supportsModelCatalogProbe ? (
            <Flex gap="2" mt="2" wrap="wrap">
              <Button size="2" variant="soft" color="gray" onClick={onProbeModelCatalog} disabled={isProbingModelCatalog}>
                <SearchIcon />
                {isProbingModelCatalog ? "Probing…" : "Probe Model Catalog"}
              </Button>
            </Flex>
          ) : null}
        </Box>

        <Box>
          <Heading size="2" mb="1">Auth</Heading>
          <ProviderAuthenticationSummary
            providerId={provider.providerId}
            providerCredentialId={provider.providerCredentialId}
            kind={authenticationKind}
          />
          <Flex gap="2" mt="2" wrap="wrap">
            <Button size="2" variant="soft" color="gray" onClick={onStartAuthentication}>
              Update Authentication…
            </Button>
            {showObservabilityAuthenticationAction ? (
              <Button size="2" variant="soft" color="gray" onClick={onStartObservabilityAuthentication}>
                {observabilityAuthenticationActionLabel || "Update Observability Auth…"}
              </Button>
            ) : null}
            {supportsQuotaQuery ? (
              <Button size="2" variant="soft" color="gray" onClick={onProbeQuotaQuery} disabled={isProbingQuotaQuery}>
                {isProbingQuotaQuery ? "Probing…" : "Probe Quota Query"}
              </Button>
            ) : null}
          </Flex>
        </Box>

        <ErrorCalloutIf error={deleteError} />
      </Flex>

      <DialogFooterActions
        isSubmitting={isDeleting}
        cancelText="Close"
        onCancel={onClose}
        submitText="Delete Provider"
        onSubmit={onDelete}
        mt="4"
        actionsOrder="submit-first"
      />
    </>
  );
}

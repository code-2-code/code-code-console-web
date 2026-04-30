import { Box, Button, Dialog, Flex, Heading, Text } from "@radix-ui/themes";
import type { ComponentProps } from "react";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { DialogFooterActions, ErrorCalloutIf, SoftBadge, StatusBadge } from "@code-code/console-web-ui";
import { VendorAvatar } from "../../models/components/vendor-avatar";
import { useProviderActiveQueryStatus } from "../provider-active-query-status";
import { providerModel } from "../provider-model";
import { ProviderAuthenticationSummary } from "./provider-authentication-summary";
import { ProviderModelCatalogBadges } from "./provider-model-catalog";

type Props = {
  provider: ProviderView;
  authenticationKind: ComponentProps<typeof ProviderAuthenticationSummary>["kind"];
  vendorIconUrl?: string;
  supportsActiveQuery: boolean;
  isProbingActiveQuery: boolean;
  deleteError: string;
  isDeleting: boolean;
  observabilityAuthenticationActionLabel?: string;
  onClose: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onStartAuthentication: () => void;
  onStartObservabilityAuthentication: () => void;
  onProbeActiveQuery: () => void;
  showObservabilityAuthenticationAction?: boolean;
};

export function ProviderDetailsView({
  provider,
  authenticationKind,
  vendorIconUrl,
  supportsActiveQuery,
  isProbingActiveQuery,
  deleteError,
  isDeleting,
  observabilityAuthenticationActionLabel,
  onClose,
  onDelete,
  onStartRename,
  onStartAuthentication,
  onStartObservabilityAuthentication,
  onProbeActiveQuery,
  showObservabilityAuthenticationAction,
}: Props) {
  const providerViewModel = providerModel(provider);
  const protocolLabels = providerViewModel.protocolLabels();
  const accountStatus = useProviderActiveQueryStatus(provider, supportsActiveQuery) ?? providerViewModel.status();

  return (
    <>
      <Flex justify="between" align="start" mb="4" gap="3">
        <Box>
          <Flex align="center" gap="2">
            <VendorAvatar displayName={providerViewModel.displayName()} iconUrl={vendorIconUrl} size="2" />
            <Dialog.Title mb="0">{providerViewModel.displayName()}</Dialog.Title>
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
          <ProviderModelCatalogBadges catalog={provider.modelCatalog ?? undefined} />
        </Box>

        <Box>
          <Heading size="2" mb="1">Auth</Heading>
          <ProviderAuthenticationSummary
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
            {supportsActiveQuery ? (
              <Button size="2" variant="soft" color="gray" onClick={onProbeActiveQuery} disabled={isProbingActiveQuery}>
                {isProbingActiveQuery ? "Probing…" : "Probe Active Query"}
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

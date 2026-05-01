import { useMemo, useState } from "react";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { Box, Button, Flex } from "@radix-ui/themes";
import { ErrorCalloutIf, NoDataCallout, PlusIcon, SearchTextField } from "@code-code/console-web-ui";
import { AddProviderDialog } from "../domains/providers/components/add-provider-dialog";
import { ProviderCardGrid } from "../domains/providers/components/provider-card-grid";
import { ProviderDetailsDialog as ProviderDetailsDialog } from "../domains/providers/components/provider-details-dialog";
import { providerModel } from "../domains/providers/provider-model";
import { type ProviderConnectOptionKind } from "../domains/providers/provider-connect-options";
import { useProvidersPageController } from "./use-providers-page-controller";

function ProviderAddActions({
  onAdd,
  onRefreshQuota,
  refreshingQuota,
}: {
  onAdd: (kind: ProviderConnectOptionKind) => void;
  onRefreshQuota: () => void;
  refreshingQuota: boolean;
}) {
  return (
    <Flex gap="2" wrap="wrap" justify="end">
      <Button size="2" variant="soft" color="gray" onClick={onRefreshQuota} disabled={refreshingQuota}>
        {refreshingQuota ? "Refreshing quota..." : "Refresh quota"}
      </Button>
      <Button size="2" variant="solid" onClick={() => onAdd("surfaceApiKey")}>
        <PlusIcon />
        Provider API Key
      </Button>
      <Button size="2" variant="soft" onClick={() => onAdd("customApiKey")}>
        Custom API Key
      </Button>
      <Button size="2" variant="soft" onClick={() => onAdd("cliOAuth")}>
        CLI OAuth
      </Button>
    </Flex>
  );
}

export function ProvidersPage() {
  const page = useProvidersPageController();
  const [providerQuery, setProviderQuery] = useState("");

  // Data-driven: if no provider has an ID, the API is returning sanitized data
  // (e.g. showcase-api strips IDs). Management actions require provider IDs.
  const hasProviderIds = useMemo(
    () => page.sortedProviders.some((provider) => Boolean(provider.providerId)),
    [page.sortedProviders],
  );
  const readonly = !page.isLoading && page.sortedProviders.length > 0 && !hasProviderIds;
  const canManageProviders = !page.isLoading && !page.blockingError && !readonly;
  const filteredProviders = useMemo(
    () => filterProviders(page.sortedProviders, providerQuery),
    [page.sortedProviders, providerQuery],
  );
  const providerSummary = page.isLoading
    ? "Loading providers..."
    : providerQuery.trim()
      ? `Showing ${filteredProviders.length} of ${page.sortedProviders.length} providers`
      : `${page.sortedProviders.length} provider${page.sortedProviders.length === 1 ? "" : "s"}`;

  const handleAddDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && page.searchState.connectSessionId) {
      page.dismissedConnectSessionIDRef.current = page.searchState.connectSessionId;
    }
    page.setIsAddDialogOpen(nextOpen);
    if (!nextOpen) {
      page.updateConnectSessionParam(undefined, undefined);
    }
  };

  return (
    <Box>
      {canManageProviders ? (
        <AddProviderDialog
          open={page.isAddDialogOpen}
          connectSessionId={page.searchState.connectSessionId}
          preferredOptionKind={page.preferredAddKind}
          onOpenChange={handleAddDialogOpenChange}
          onConnectSessionChange={page.updateConnectSessionParam}
          onConnected={page.handleConnected}
        />
      ) : null}
      {hasProviderIds ? (
        <>
          <ProviderDetailsDialog
            provider={page.selectedProvider}
            clis={page.clis}
            productInfos={page.productInfos}
            surfaces={page.surfaces}
            vendors={page.vendors}
            onClose={page.closeProvider}
            onUpdated={page.refreshProviderPageData}
            onProbeModelCatalog={(provider) => void page.handleProbeProviderModelCatalog(provider)}
            onProbeQuotaQuery={(provider) => void page.handleProbeProviderQuotaQuery(provider)}
            probingModelCatalogProviderId={page.probingModelCatalogProviderId}
            probingProviderId={page.probingProviderId}
          />
        </>
      ) : null}
      <ProviderCardGrid
        providers={filteredProviders}
        clis={page.clis}
        productInfos={page.productInfos}
        surfaces={page.surfaces}
        vendors={page.vendors}
        loading={page.isLoading}
        error={page.blockingError}
        readonly={readonly}
        workflowStatuses={hasProviderIds ? page.providerWorkflowStatuses : undefined}
        probingProviderId={hasProviderIds ? page.probingProviderId : undefined}
        probingModelCatalogProviderId={hasProviderIds ? page.probingModelCatalogProviderId : undefined}
        onOpen={hasProviderIds ? page.openProvider : undefined}
        onProbeModelCatalog={hasProviderIds ? ((provider) => void page.handleProbeProviderModelCatalog(provider)) : undefined}
        onProbeQuotaQuery={hasProviderIds ? ((provider) => void page.handleProbeProviderQuotaQuery(provider)) : undefined}
        onRetry={() => void page.mutateProviders()}
        subtitle={providerSummary}
        emptyTitle={providerQuery.trim() ? "No providers match this search." : "No providers."}
        headerActions={(
          <ProviderHeaderActions
            canManageProviders={canManageProviders}
            onAdd={page.handleAdd}
            onQueryChange={setProviderQuery}
            onRefreshQuota={() => void page.handleRefreshQuota()}
            query={providerQuery}
            refreshingQuota={page.isRefreshingQuota}
          />
        )}
        headerCallouts={hasProviderIds ? (
          <>
            <ErrorCalloutIf error={page.providerActionError} mb="4" />
            <ErrorCalloutIf error={page.providerStatusEventsError} mb="4" />
            {page.providerActionMessage ? <NoDataCallout mb="4">{page.providerActionMessage}</NoDataCallout> : null}
          </>
        ) : undefined}
      />
    </Box>
  );
}

function ProviderHeaderActions({
  canManageProviders,
  onAdd,
  onQueryChange,
  onRefreshQuota,
  query,
  refreshingQuota,
}: {
  canManageProviders: boolean;
  onAdd: (kind: ProviderConnectOptionKind) => void;
  onQueryChange: (value: string) => void;
  onRefreshQuota: () => void;
  query: string;
  refreshingQuota: boolean;
}) {
  return (
    <Flex align="center" gap="2" wrap="wrap" justify="end" style={{ flex: "1 1 560px", minWidth: 280 }}>
      <Box style={{ flex: "1 1 260px", minWidth: 220, maxWidth: 420 }}>
        <SearchTextField
          ariaLabel="Search providers"
          placeholder="Search providers, services, models"
          size="2"
          value={query}
          onValueChange={onQueryChange}
        />
      </Box>
      {query.trim() ? (
        <Button color="gray" size="2" variant="ghost" onClick={() => onQueryChange("")}>
          Clear
        </Button>
      ) : null}
      {canManageProviders ? (
        <ProviderAddActions
          onAdd={onAdd}
          onRefreshQuota={onRefreshQuota}
          refreshingQuota={refreshingQuota}
        />
      ) : null}
    </Flex>
  );
}

function filterProviders(providers: ProviderView[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return providers;
  }
  return providers.filter((provider) => providerSearchText(provider).includes(normalizedQuery));
}

function providerSearchText(provider: ProviderView) {
  const model = providerModel(provider);
  const values = [
    model.displayName(),
    model.authenticationLabel(),
    model.operationalSummary(),
    ...model.protocolLabels(),
    provider.providerId,
    provider.providerCredentialId,
    provider.surfaceId,
    ...provider.models.map((item) => item.providerModelId),
  ];
  return values
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .toLowerCase();
}

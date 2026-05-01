import { useState } from "react";
import { Dialog } from "@radix-ui/themes";

import type { CLI, Surface } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { requestErrorMessage } from "@code-code/console-web-ui";
import { deleteProvider, updateProvider } from "../api";
import { providerModel } from "../provider-model";
import { providerSupportsModelCatalogProbe } from "../provider-model-catalog-probe";
import { providerObservabilityAuthPresentation } from "../provider-observability-auth-presentation";
import { providerSupportsQuotaQuery, resolveProviderQuotaQueryOwner } from "../provider-observability-visualization";
import { ProviderAuthenticationView } from "./provider-authentication-view";
import { ProviderDetailsView } from "./provider-details-view";
import { ProviderObservabilityAuthenticationView } from "./provider-observability-authentication-view";
import { ProviderRenameView } from "./provider-rename-view";
import { resolveProductInfo } from "../provider-product-info";
import { cliIdForSurface, providerProductInfoId } from "../provider-support-surface";

type Props = {
  provider: ProviderView | null;
  clis: CLI[];
  productInfos: ProductInfo[];
  surfaces: Surface[];
  vendors: Vendor[];
  onClose: () => void;
  onUpdated?: () => void;
  onProbeModelCatalog: (provider: ProviderView) => void;
  onProbeQuotaQuery: (provider: ProviderView) => void;
  probingModelCatalogProviderId?: string;
  probingProviderId?: string;
};

export function ProviderDetailsDialog({
  provider,
  clis,
  productInfos,
  surfaces,
  vendors,
  onClose,
  onUpdated,
  onProbeModelCatalog,
  onProbeQuotaQuery,
  probingModelCatalogProviderId,
  probingProviderId,
}: Props) {
  const [view, setView] = useState<"details" | "rename" | "authentication" | "observabilityAuthentication">("details");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const providerViewModel = provider ? providerModel(provider) : null;
  const normalizedRenameValue = renameValue.trim();
  const providerDisplayName = provider?.displayName?.trim() || "";
  const canSaveRename = providerViewModel
    ? normalizedRenameValue !== "" && normalizedRenameValue !== providerDisplayName
    : false;
  const authenticationKind = providerViewModel?.authenticationKind() || "apiKey";
  const supportsModelCatalogProbe = providerSupportsModelCatalogProbe(provider, surfaces);
  const supportsQuotaQuery = provider ? providerSupportsQuotaQuery(provider, clis, vendors) : false;
  const quotaQueryOwner = provider ? resolveProviderQuotaQueryOwner(provider, clis, vendors) : null;
  const observabilityAuth = providerObservabilityAuthPresentation(
    quotaQueryOwner?.kind === "vendor" ? quotaQueryOwner.vendorId : undefined,
    vendors,
    quotaQueryOwner?.surfaceId || providerViewModel?.primarySurfaceId(),
  );
  const resolvedProductInfo = provider ? resolveProductInfo(providerProductInfoId(provider, vendors, surfaces), productInfos, vendors) : undefined;
  const showDedicatedObservabilityAuthentication = Boolean(observabilityAuth);
  const handleClose = () => {
    setView("details");
    setDeleteError("");
    setIsDeleting(false);
    setRenameError("");
    setRenameValue("");
    setIsRenaming(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!provider) {
      return;
    }
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteProvider(provider.providerId);
      handleClose();
      onUpdated?.();
    } catch (error: unknown) {
      setDeleteError(requestErrorMessage(error, "Delete failed. Please try again."));
      setIsDeleting(false);
    }
  };

  const handleRenameSave = async () => {
    if (!provider || !canSaveRename) {
      return;
    }
    setRenameError("");
    setIsRenaming(true);
    try {
      await updateProvider(provider.providerId, normalizedRenameValue);
      handleClose();
      onUpdated?.();
    } catch (error: unknown) {
      setRenameError(requestErrorMessage(error, "Rename failed. Please try again."));
      setIsRenaming(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
    }
  };

  const handleStartRename = () => {
    setRenameValue(provider?.displayName || "");
    setRenameError("");
    setView("rename");
  };

  const handleStartAuthentication = () => {
    setView("authentication");
  };

  const handleStartObservabilityAuthentication = () => {
    setView("observabilityAuthentication");
  };

  const handleRenameSubmit = () => {
    void handleRenameSave();
  };
  const handleDeleteSubmit = () => {
    void handleDelete();
  };

  return (
    <Dialog.Root open={provider !== null} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="640px">
        {provider && view === "details" ? (
          <ProviderDetailsView
            provider={provider}
            authenticationKind={authenticationKind}
            displayName={resolvedProductInfo?.displayName || providerViewModel?.displayName() || ""}
            iconUrl={resolvedProductInfo?.iconUrl}

            supportsModelCatalogProbe={supportsModelCatalogProbe}
            supportsQuotaQuery={supportsQuotaQuery}
            isProbingModelCatalog={probingModelCatalogProviderId === provider.providerId}
            isProbingQuotaQuery={probingProviderId === provider.providerId}
            deleteError={deleteError}
            isDeleting={isDeleting}
            observabilityAuthenticationActionLabel={observabilityAuth?.providerActionLabel}
            onClose={handleClose}
            onDelete={handleDeleteSubmit}
            onStartRename={handleStartRename}
            onStartAuthentication={handleStartAuthentication}
            onStartObservabilityAuthentication={handleStartObservabilityAuthentication}
            onProbeModelCatalog={() => onProbeModelCatalog(provider)}
            onProbeQuotaQuery={() => onProbeQuotaQuery(provider)}
            showObservabilityAuthenticationAction={showDedicatedObservabilityAuthentication}
          />
        ) : null}

        {provider && view === "rename" ? (
          <ProviderRenameView
            renameValue={renameValue}
            renameError={renameError}
            isRenaming={isRenaming}
            canSaveRename={canSaveRename}
            onRenameValueChange={setRenameValue}
            onBack={() => setView("details")}
            onSubmit={handleRenameSubmit}
          />
        ) : null}

        {provider && providerViewModel && view === "authentication" ? (
          <ProviderAuthenticationView
            provider={provider}
            authenticationKind={authenticationKind}
            apiKeyLabel={resolvedProductInfo?.displayName || providerViewModel.displayName()}
            cliId={cliIdForSurface(surfaces, provider.surfaceId)}
            onSuccess={() => {
              setView("details");
              onUpdated?.();
            }}
            onCancel={() => setView("details")}
          />
        ) : null}

        {provider && observabilityAuth && view === "observabilityAuthentication" ? (
          <ProviderObservabilityAuthenticationView
            provider={provider}
            presentation={observabilityAuth}
            onSuccess={() => {
              setView("details");
              onUpdated?.();
            }}
            onCancel={() => setView("details")}
          />
        ) : null}
      </Dialog.Content>
    </Dialog.Root>
  );
}

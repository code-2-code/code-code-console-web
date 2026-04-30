import type { ProviderModelCatalogEntry } from "@code-code/agent-contract/provider/v1";

export type ProviderModelPresentation = {
  detail: string;
  key: string;
  label: string;
  providerModelId: string;
};

export function describeProviderModelCatalogEntry(
  model: ProviderModelCatalogEntry,
): ProviderModelPresentation {
  const providerModelId = model.providerModelId.trim();
  const canonicalModelId = model.modelRef?.modelId?.trim() || "";
  const label = canonicalModelId && canonicalModelId !== providerModelId
    ? canonicalModelId
    : providerModelId;
  const detail = canonicalModelId && canonicalModelId !== providerModelId
    ? `Provider ID: ${providerModelId}`
    : "";
  return {
    detail,
    key: providerModelId || canonicalModelId,
    label: label || providerModelId,
    providerModelId,
  };
}

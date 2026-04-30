import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";

export function getProviderModelCount(instance: ProviderView) {
  return Math.max(instance.runtime?.catalog?.models.length ?? 0, 0);
}

export function providerModelsSummary(instance: ProviderView) {
  const modelCount = getProviderModelCount(instance);
  if (modelCount === 0) {
    return "No models configured";
  }
  return `${modelCount} model${modelCount === 1 ? "" : "s"}`;
}

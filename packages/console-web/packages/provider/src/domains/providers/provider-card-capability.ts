import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { CLI, Vendor } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderObservabilityOwner } from "./provider-owner-observability-model";
import { resolveProviderObservabilityOwner, providerSupportsQuotaQuery } from "./provider-observability-visualization";

export type ProviderCardOwner = ProviderObservabilityOwner;

export function resolveProviderCardOwner(args: {
  provider: ProviderView;
  clis: CLI[];
  vendors: Vendor[];
}): ProviderCardOwner | null {
  const owner = resolveProviderObservabilityOwner(args.provider, args.vendors);
  if (!args.provider.surfaceId.trim() || !owner) {
    return null;
  }
  if (providerSupportsQuotaQuery(args.provider, args.clis, args.vendors)) {
    return owner;
  }
  return null;
}

import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { CLI, Vendor } from "@code-code/agent-contract/platform/support/v1";
import { providerModel } from "./provider-model";
import type { ProviderObservabilityOwner } from "./provider-owner-observability-model";
import { resolveProviderObservabilityOwner, providerSupportsActiveQuery } from "./provider-observability-visualization";

export type ProviderCardOwner = ProviderObservabilityOwner;

export function resolveProviderCardOwner(args: {
  provider: ProviderView;
  clis: CLI[];
  vendors: Vendor[];
}): ProviderCardOwner | null {
  const surface = providerModel(args.provider).primarySurface();
  const owner = resolveProviderObservabilityOwner(args.provider, args.vendors);
  if (!surface || !owner) {
    return null;
  }
  if (providerSupportsActiveQuery(args.provider, args.clis, args.vendors)) {
    return owner;
  }
  return null;
}

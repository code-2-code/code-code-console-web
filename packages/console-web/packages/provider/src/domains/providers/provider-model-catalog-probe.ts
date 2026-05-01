import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { Surface } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import { providerEndpointProtocol } from "./provider-endpoint-presentation";
import { ProviderProtocol } from "./provider-protocol";
import { supportSurfaceForProvider } from "./provider-support-surface";

const customAPIKeySurfaceID = "custom.api";

export function providerSupportsModelCatalogProbe(
  provider: ProviderView | null | undefined,
  surfaces: readonly Surface[] = [],
) {
  if (supportSurfaceForProvider(provider, [], surfaces)?.modelCatalogProbeId?.trim()) {
    return true;
  }
  if (provider?.surfaceId?.trim() !== customAPIKeySurfaceID) {
    return false;
  }
  return (provider.endpoints ?? []).some(customAPIKeyEndpointSupportsModelCatalogProbe);
}

function customAPIKeyEndpointSupportsModelCatalogProbe(endpoint: ProviderEndpoint) {
  switch (providerEndpointProtocol(endpoint)) {
    case ProviderProtocol.OPENAI_COMPATIBLE:
    case ProviderProtocol.OPENAI_RESPONSES:
      return true;
    default:
      return false;
  }
}

import { describe, expect, it } from "vitest";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { Surface } from "@code-code/agent-contract/platform/support/v1";
import { ProviderProtocol, type ProviderProtocolValue } from "./provider-protocol";
import { providerSupportsModelCatalogProbe } from "./provider-model-catalog-probe";

describe("providerSupportsModelCatalogProbe", () => {
  it("uses the support surface probe id when present", () => {
    expect(providerSupportsModelCatalogProbe(
      provider("openai-compatible", ProviderProtocol.OPENAI_COMPATIBLE),
      [surface("openai-compatible", "surface.openai-compatible")],
    )).toBe(true);
  });

  it("supports custom OpenAI-compatible API key providers", () => {
    expect(providerSupportsModelCatalogProbe(
      provider("custom.api", ProviderProtocol.OPENAI_COMPATIBLE),
      [surface("custom.api", "")],
    )).toBe(true);
  });

  it("supports custom OpenAI Responses API key providers", () => {
    expect(providerSupportsModelCatalogProbe(
      provider("custom.api", ProviderProtocol.OPENAI_RESPONSES),
      [surface("custom.api", "")],
    )).toBe(true);
  });

  it("does not expose model probing for custom protocols without a default catalog probe", () => {
    expect(providerSupportsModelCatalogProbe(
      provider("custom.api", ProviderProtocol.GEMINI),
      [surface("custom.api", "")],
    )).toBe(false);
  });
});

function provider(surfaceId: string, protocol: ProviderProtocolValue): ProviderView {
  return {
    providerId: "provider-1",
    displayName: "Provider",
    providerCredentialId: "credential-1",
    surfaceId,
    endpoints: [apiEndpoint(protocol)],
    models: [],
  };
}

function apiEndpoint(protocol: ProviderProtocolValue): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: { protocol, baseUrl: "https://api.example.com/v1" },
    },
  } as ProviderEndpoint;
}

function surface(surfaceId: string, modelCatalogProbeId: string): Surface {
  return {
    surfaceId,
    productInfoId: "custom-api-key",
    modelCatalogProbeId,
    spec: {
      case: "api",
      value: { apiEndpoints: [] },
    },
  } as Surface;
}

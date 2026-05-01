import { describe, expect, it } from "vitest";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { CLI } from "@code-code/agent-contract/platform/support/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderProtocol } from "./provider-protocol";
import { resolveProviderCardOwner } from "./provider-card-capability";

describe("provider-card-capability", () => {
  it("returns null when cli does not declare provider card support", () => {
    const provider = createCLIProvider();
    const clis: CLI[] = [{ cliId: "codex", displayName: "Codex CLI" }];

    expect(
      resolveProviderCardOwner({
        provider,
        clis,
        vendors: [],
      }),
    ).toBeNull();
  });

  it("returns cli owner when supported", () => {
    const provider = createCLIProvider();
    const clis: CLI[] = [{
      cliId: "codex",
      displayName: "Codex CLI",
      oauth: {
        observability: {
          profiles: [{ collection: { case: "quotaQuery", value: {} } }],
        },
      },
    }];

    expect(
      resolveProviderCardOwner({
        provider,
        clis,
        vendors: [],
      }),
    ).toEqual({ kind: "cli", cliId: "codex", surfaceId: "codex-cli" });
  });

  it("returns vendor owner when supported", () => {
    const provider: ProviderView = {
      providerId: "provider-1",
      displayName: "OpenAI",
      surfaceId: "openai-api",
      endpoints: [apiEndpoint()],
      models: [],
    };
    const vendors: Vendor[] = [{
      vendor: {
        vendorId: "openai",
        displayName: "OpenAI",
      },
      surfaces: [{
        surfaceId: "openai-api",
        productInfoId: "openai",
        spec: {
          case: "api",
          value: { apiEndpoints: [{ baseUrl: "https://api.openai.com/v1", protocol: ProviderProtocol.OPENAI_COMPATIBLE }] },
        },
        observability: {
          profiles: [{ collection: { case: "quotaQuery", value: {} } }],
        },
      }],
    }];

    expect(
      resolveProviderCardOwner({
        provider,
        clis: [],
        vendors,
      }),
    ).toEqual({ kind: "vendor", vendorId: "openai", surfaceId: "openai-api" });
  });
});

function createCLIProvider(): ProviderView {
  return {
    providerId: "provider-1",
    displayName: "Codex",
    surfaceId: "codex-cli",
    endpoints: [cliEndpoint("codex")],
    models: [],
  };
}

function cliEndpoint(cliId: string): ProviderEndpoint {
  return {
    type: ProviderEndpointType.CLI,
    shape: {
      case: "cli",
      value: { cliId },
    },
  } as ProviderEndpoint;
}

function apiEndpoint(): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: { protocol: ProviderProtocol.OPENAI_COMPATIBLE, baseUrl: "https://api.openai.com/v1" },
    },
  } as ProviderEndpoint;
}

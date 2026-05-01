import { describe, expect, it } from "vitest";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { CLI } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { ProviderProtocol } from "./provider-protocol";
import {
  providerQuotaQueryProviderIDs,
  resolveProviderObservabilityOwner,
  providerSupportsQuotaQuery,
} from "./provider-observability-visualization";

describe("provider-observability-visualization", () => {
  it("resolves cli owner from cli provider endpoint", () => {
    const owner = resolveProviderObservabilityOwner(createCLIProvider("codex"));

    expect(owner).toEqual({ kind: "cli", cliId: "codex", surfaceId: "codex-cli" });
  });

  it("resolves vendor owner from api provider endpoint", () => {
    const owner = resolveProviderObservabilityOwner(
      createVendorProvider("minimax"),
      [createVendor("minimax", false, "minimax-api")],
    );

    expect(owner).toEqual({ kind: "vendor", vendorId: "minimax", surfaceId: "minimax-api" });
  });

  it("detects quota query support from observability profiles", () => {
    expect(
      providerSupportsQuotaQuery(
        createVendorProvider("minimax"),
        [],
        [createVendor("minimax", true, "minimax-api")],
      ),
    ).toBe(true);
  });

  it("collects quota query provider id only when the owner is supported", () => {
    expect(
      providerQuotaQueryProviderIDs(
        createCLIProvider("codex"),
        [createCLI("codex", true, "codex-cli")],
        [],
      ),
    ).toEqual(["provider-1"]);
    expect(
      providerQuotaQueryProviderIDs(
        createVendorProvider("openai"),
        [],
        [createVendor("openai", false, "openai-api")],
      ),
    ).toEqual([]);
  });

  it("detects quota query with normalized owner ids", () => {
    expect(
      providerSupportsQuotaQuery(
        createCLIProvider("  CoDeX "),
        [createCLI("codex", true, "codex-cli")],
        [],
      ),
    ).toBe(true);
    expect(
      providerSupportsQuotaQuery(
        createVendorProvider("  MiNiMaX "),
        [],
        [createVendor("minimax", true, "minimax-api")],
      ),
    ).toBe(true);
  });
});

function createCLIProvider(cliId: string): ProviderView {
  return {
    providerId: "provider-1",
    displayName: "Provider",
    surfaceId: "codex-cli",
    endpoints: [cliEndpoint(cliId)],
    models: [],
  } as ProviderView;
}

function createVendorProvider(vendorId: string): ProviderView {
  return {
    providerId: "provider-1",
    displayName: "Provider",
    surfaceId: "minimax-api",
    endpoints: [apiEndpoint()],
    models: [],
  } as ProviderView;
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
      value: { protocol: ProviderProtocol.OPENAI_COMPATIBLE, baseUrl: "https://api.example.com/v1" },
    },
  } as ProviderEndpoint;
}

function createCLI(cliId: string, quotaQuery = false, _surfaceId = "codex-cli"): CLI {
  return {
    cliId,
    oauth: {
      observability: {
        profiles: quotaQuery ? [{ collection: { case: "quotaQuery", value: {} } }] : [],
      },
    },
  };
}

function createVendor(vendorId: string, quotaQuery = false, surfaceId = "minimax-api"): Vendor {
  return {
    vendor: { vendorId },
    surfaces: [{
      surfaceId,
      productInfoId: vendorId.trim(),
      spec: {
        case: "api",
        value: { apiEndpoints: [{ baseUrl: "https://api.example.com/v1", protocol: ProviderProtocol.OPENAI_COMPATIBLE }] },
      },
      observability: {
        profiles: quotaQuery ? [{ collection: { case: "quotaQuery", value: {} } }] : [],
      },
    }],
  };
}

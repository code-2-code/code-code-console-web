import { describe, expect, it } from "vitest";
import type { ProviderSurfaceRuntime } from "@code-code/agent-contract/provider/v1";
import type { CLI } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { ProviderProtocol } from "./provider-protocol";
import {
  providerActiveQueryProviderIDs,
  resolveProviderObservabilityOwner,
  providerSupportsActiveQuery,
} from "./provider-observability-visualization";

describe("provider-observability-visualization", () => {
  it("resolves cli owner from cli provider runtime", () => {
    const owner = resolveProviderObservabilityOwner(createCLIProvider("codex"));

    expect(owner).toEqual({ kind: "cli", cliId: "codex", surfaceId: "codex-cli" });
  });

  it("resolves vendor owner from api provider runtime", () => {
    const owner = resolveProviderObservabilityOwner(createVendorProvider("minimax"));

    expect(owner).toEqual({ kind: "vendor", vendorId: "minimax", surfaceId: "minimax-api" });
  });

  it("detects active query support from observability profiles", () => {
    expect(
      providerSupportsActiveQuery(
        createVendorProvider("minimax"),
        [],
        [createVendor("minimax", true, "minimax-api")],
      ),
    ).toBe(true);
  });

  it("collects active query provider id only when the owner is supported", () => {
    expect(
      providerActiveQueryProviderIDs(
        createCLIProvider("codex"),
        [createCLI("codex", true, "codex-cli")],
        [],
      ),
    ).toEqual(["provider-1"]);
    expect(
      providerActiveQueryProviderIDs(
        createVendorProvider("openai"),
        [],
        [createVendor("openai", false, "openai-api")],
      ),
    ).toEqual([]);
  });

  it("detects active query with normalized owner ids", () => {
    expect(
      providerSupportsActiveQuery(
        createCLIProvider("  CoDeX "),
        [createCLI("codex", true, "codex-cli")],
        [],
      ),
    ).toBe(true);
    expect(
      providerSupportsActiveQuery(
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
    runtime: cliRuntime(cliId),
  } as ProviderView;
}

function createVendorProvider(vendorId: string): ProviderView {
  return {
    providerId: "provider-1",
    displayName: "Provider",
    productInfoId: vendorId.trim(),
    surfaceId: "minimax-api",
    runtime: apiRuntime(),
  } as ProviderView;
}

function cliRuntime(cliId: string): ProviderSurfaceRuntime {
  return {
    access: {
      case: "cli",
      value: { cliId },
    },
  } as ProviderSurfaceRuntime;
}

function apiRuntime(): ProviderSurfaceRuntime {
  return {
    access: {
      case: "api",
      value: { protocol: ProviderProtocol.OPENAI_COMPATIBLE, baseUrl: "https://api.example.com/v1" },
    },
  } as ProviderSurfaceRuntime;
}

function createCLI(cliId: string, activeQuery = false, surfaceId = "codex-cli"): CLI {
  return {
    cliId,
    oauth: {
      providerBinding: { surfaceId },
      observability: {
        profiles: activeQuery ? [{ collection: { case: "activeQuery", value: {} } }] : [],
      },
    },
  };
}

function createVendor(vendorId: string, activeQuery = false, surfaceId = "minimax-api"): Vendor {
  return {
    vendor: { vendorId },
    providerBindings: [{
      providerBinding: { surfaceId },
      surfaceTemplates: [],
      observability: {
        profiles: activeQuery ? [{ collection: { case: "activeQuery", value: {} } }] : [],
      },
    }],
  };
}

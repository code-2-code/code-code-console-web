import { Theme } from "@radix-ui/themes";
import { fromJson } from "@bufbuild/protobuf";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import {
  ListVendorsResponseSchema,
} from "@code-code/agent-contract/platform/support/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { protobufJsonReadOptions } from "@code-code/console-web-ui";
import { ProviderProtocol, type ProviderProtocolValue } from "../provider-protocol";
import { ProviderCard } from "./provider-card";

const useProviderObservabilityMock = vi.fn();

vi.mock("../api", () => ({
  useProviderObservability: (...args: unknown[]) => useProviderObservabilityMock(...args),
}));

describe("ProviderCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders quota query failure once in the provider panel", () => {
    useProviderObservabilityMock.mockReturnValue({
      detail: googleFailedObservability(),
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(
      <Theme>
        <ProviderCard
          provider={googleProvider()}
          clis={[]}
          vendors={[googleVendor()]}
        />
      </Theme>,
    );

    expect(screen.getAllByText(/^Failed/)).toHaveLength(1);
    expect(screen.getByText("No current quota gauge values.")).toBeInTheDocument();
  });

  it("renders Google AI Studio quota metrics from API-shaped support and card payloads", () => {
    useProviderObservabilityMock.mockImplementation((_providerId: string | undefined, _window: string, view: string) => ({
      detail: view === "card" ? googleQuotaObservability() : googleExecutedObservability(),
      isLoading: false,
      isError: false,
      error: undefined,
    }));

    render(
      <Theme>
        <ProviderCard
          provider={googleProvider()}
          clis={[]}
          vendors={apiShapedGoogleVendors()}
        />
      </Theme>,
    );

    expect(screen.getByText("gemini-2.5-flash · Requests")).toBeInTheDocument();
    expect(screen.getByText("9,900 / 10K")).toBeInTheDocument();
  });

  it("opens Mistral quota details from the provider card drawer", () => {
    const onOpen = vi.fn();
    useProviderObservabilityMock.mockImplementation((_providerId: string | undefined, _window: string, view: string) => ({
      detail: view === "card" ? mistralQuotaObservability() : mistralExecutedObservability(),
      isLoading: false,
      isError: false,
      error: undefined,
    }));

    render(
      <Theme>
        <ProviderCard
          provider={mistralProvider()}
          clis={[]}
          vendors={[mistralVendor()]}
          onOpen={onOpen}
        />
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Usage details" }));

    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Mistral usage" })).toBeInTheDocument();
    expect(screen.getByText("Admin billing usage and quota details")).toBeInTheDocument();
    expect(screen.getByText("Monthly tokens")).toBeInTheDocument();
    expect(screen.getByText("\u20ac1.2345 · 62 / 4M")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Monthly tokens"));
    expect(onOpen).not.toHaveBeenCalled();
  });
});

function googleProvider(): ProviderView {
  return {
    $typeName: "platform.management.v1.ProviderView",
    providerId: "google-867bcb",
    displayName: "Google",
    providerCredentialId: "google-api-key",
    surfaceId: "gemini",
    endpoints: [apiEndpoint(ProviderProtocol.GEMINI, "https://generativelanguage.googleapis.com/v1beta")],
    models: [],
    status: {
      phase: ProviderPhase.READY,
    },
  };
}

function mistralProvider(): ProviderView {
  return {
    $typeName: "platform.management.v1.ProviderView",
    providerId: "mistral-6d5a5e",
    displayName: "Mistral AI",
    providerCredentialId: "mistral-api-key",
    surfaceId: "openai-compatible",
    endpoints: [apiEndpoint(ProviderProtocol.OPENAI_COMPATIBLE, "https://api.mistral.ai/v1")],
    models: [],
    status: {
      phase: ProviderPhase.READY,
    },
  };
}

function googleVendor(): Vendor {
  return {
    $typeName: "platform.support.v1.Vendor",
    vendor: {
      $typeName: "vendor_definition.v1.Vendor",
      vendorId: "google",
      displayName: "Google",
      aliases: [],
      iconUrl: "",
      websiteUrl: "",
      description: "",
    },
    surfaces: [{
      $typeName: "platform.support.v1.Surface",
      surfaceId: "gemini",
      productInfoId: "google",
      spec: { case: "api", value: { $typeName: "platform.support.v1.ApiSurface", apiEndpoints: [] } },
      observability: {
        $typeName: "observability.v1.ObservabilityCapability",
        profiles: [{
          $typeName: "observability.v1.ObservabilityProfile",
          profileId: "aistudio-quota",
          displayName: "AI Studio Quota",
          scopeIds: [],
          metrics: [],
          metricQueries: [],
          collection: {
            case: "quotaQuery",
            value: {
              $typeName: "observability.v1.QuotaQueryCollection",
              collectorId: "google-aistudio-quotas",
              dynamicParameters: [],
              credentialBackfills: [],
            },
          },
        }],
      },
    }],
  };
}

function mistralVendor(): Vendor {
  return {
    $typeName: "platform.support.v1.Vendor",
    vendor: {
      $typeName: "vendor_definition.v1.Vendor",
      vendorId: "mistral",
      displayName: "Mistral",
      aliases: [],
      iconUrl: "",
      websiteUrl: "",
      description: "",
    },
    surfaces: [{
      $typeName: "platform.support.v1.Surface",
      surfaceId: "openai-compatible",
      productInfoId: "mistral",
      spec: { case: "api", value: { $typeName: "platform.support.v1.ApiSurface", apiEndpoints: [] } },
      observability: {
        $typeName: "observability.v1.ObservabilityCapability",
        profiles: [{
          $typeName: "observability.v1.ObservabilityProfile",
          profileId: "billing",
          displayName: "Billing",
          scopeIds: [],
          metrics: [],
          metricQueries: [],
          collection: {
            case: "quotaQuery",
            value: {
              $typeName: "observability.v1.QuotaQueryCollection",
              collectorId: "mistral-billing",
              dynamicParameters: [],
              credentialBackfills: [],
            },
          },
        }],
      },
    }],
  };
}

function googleFailedObservability() {
  return {
    providerId: "google-867bcb",
    items: [{
      owner: "vendor",
      vendorId: "google",
      surfaceIds: ["gemini"],
      lastProbeRun: [{ surfaceId: "gemini", timestamp: "2026-04-30T12:00:00Z" }],
      lastProbeOutcome: [{ surfaceId: "gemini", value: 5 }],
      lastProbeReason: [{ surfaceId: "gemini", reason: "PROBE_FAILED" }],
      runtimeMetrics: [],
    }],
  };
}

function googleExecutedObservability() {
  return {
    providerId: "google-867bcb",
    items: [{
      owner: "vendor",
      vendorId: "google",
      surfaceIds: ["gemini"],
      lastProbeRun: [{ surfaceId: "gemini", timestamp: "2026-04-30T12:18:00Z" }],
      lastProbeOutcome: [{ surfaceId: "gemini", value: 1 }],
    }],
  };
}

function mistralExecutedObservability() {
  return {
    providerId: "mistral-6d5a5e",
    items: [{
      owner: "vendor",
      vendorId: "mistral",
      surfaceIds: ["openai-compatible"],
      lastProbeRun: [{ surfaceId: "openai-compatible", timestamp: "2026-04-30T12:18:00Z" }],
      lastProbeOutcome: [{ surfaceId: "openai-compatible", value: 1 }],
    }],
  };
}

function googleQuotaObservability() {
  const labels = {
    model_category: "text_output",
    model_id: "gemini-2.5-flash",
    preview: "false",
    provider_id: "google-867bcb",
    quota_type: "RPD",
    resource: "requests",
    window: "day",
  };
  return {
    providerId: "google-867bcb",
    items: [{
      owner: "vendor",
      vendorId: "google",
      surfaceIds: ["gemini"],
      lastProbeRun: [{ surfaceId: "gemini", timestamp: "2026-04-30T12:18:00Z" }],
      lastProbeOutcome: [{ surfaceId: "gemini", value: 1 }],
      runtimeMetrics: [
        {
          metricName: "gen_ai.provider.quota.limit",
          rows: [{ labels, value: 10_000 }],
        },
        {
          metricName: "gen_ai.provider.quota.remaining",
          rows: [{ labels, value: 9_900 }],
        },
        {
          metricName: "gen_ai.provider.quota.reset.timestamp.seconds",
          rows: [{ labels, value: 1_777_593_600 }],
        },
      ],
    }],
  };
}

function mistralQuotaObservability() {
  return {
    providerId: "mistral-6d5a5e",
    items: [{
      owner: "vendor",
      vendorId: "mistral",
      surfaceIds: ["openai-compatible"],
      lastProbeRun: [{ surfaceId: "openai-compatible", timestamp: "2026-04-30T12:18:00Z" }],
      lastProbeOutcome: [{ surfaceId: "openai-compatible", value: 1 }],
      runtimeMetrics: [
        {
          metricName: "gen_ai.provider.usage.tokens.count",
          rows: [
            mistralTokenUsageRow("input", 56),
            mistralTokenUsageRow("output", 6),
          ],
        },
        {
          metricName: "gen_ai.provider.usage.cost",
          rows: [
            mistralCostRow("", "total", 1.2345),
            mistralCostRow("mistral-small-2603", "model", 1.2345),
          ],
        },
        {
          metricName: "gen_ai.provider.quota.limit",
          rows: [
            mistralQuotaRow("", "cost", 150, "billing_cap"),
            mistralQuotaRow("mistral-small-2603", "tokens", 4000000),
          ],
        },
        {
          metricName: "gen_ai.provider.quota.remaining",
          rows: [
            mistralQuotaRow("", "cost", 145, "billing_cap"),
          ],
        },
      ],
    }],
  };
}

function mistralTokenUsageRow(tokenType: string, value: number) {
  return {
    labels: {
      surface_id: "openai-compatible",
      model_id: "mistral-small-2603",
      model_label: "mistral-small-latest::mistral-small-2603",
      resource: "tokens",
      window: "month",
      token_type: tokenType,
      gen_ai_provider_name: "mistral_ai",
    },
    value,
  };
}

function mistralCostRow(modelId: string, scope: string, value: number) {
  return {
    labels: {
      surface_id: "openai-compatible",
      ...(modelId ? { model_id: modelId } : {}),
      ...(modelId ? { model_label: "mistral-small-latest::mistral-small-2603" } : {}),
      resource: "cost",
      window: "month",
      scope,
      currency: "EUR",
      currency_symbol: "\u20ac",
      gen_ai_provider_name: "mistral_ai",
    },
    value,
  };
}

function mistralQuotaRow(modelId: string, resource: string, value: number, poolId = "") {
  return {
    labels: {
      surface_id: "openai-compatible",
      ...(modelId ? { model_id: modelId } : {}),
      ...(poolId ? { quota_pool_id: poolId } : {}),
      resource,
      window: "month",
    },
    value,
  };
}

function apiShapedGoogleVendors() {
  return fromJson(ListVendorsResponseSchema, {
    items: [{
      vendor: {
        vendorId: "google",
        displayName: "Google",
      },
      surfaces: [{
        surfaceId: "gemini",
        productInfoId: "google",
        api: {
          apiEndpoints: [],
        },
        observability: {
          profiles: [{
            profileId: "aistudio_quota",
            displayName: "Google AI Studio Quota",
            quotaQuery: {
              collectorId: "google-aistudio-quotas",
            },
          }],
        },
      }],
    }],
  }, protobufJsonReadOptions).items;
}

function apiEndpoint(protocol: ProviderProtocolValue, baseUrl: string): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: { protocol, baseUrl },
    },
  } as ProviderEndpoint;
}

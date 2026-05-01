import { describe, expect, it } from "vitest";
import type { ProviderOwnerObservabilityItem } from "../api";
import { providerOwnerObservabilityModel } from "../provider-owner-observability-model";
import {
  readMistralQuotaSummary,
  readMistralUsageDetailsSummary,
  readMistralUsageSummary,
} from "./provider-card-mistral-summary";

describe("provider-card-mistral-summary", () => {
  it("reads monthly token usage rows from runtime metrics", () => {
    const summary = readMistralUsageSummary(
      providerOwnerObservabilityModel(createItem(), "mistral-ai-6d5a5e"),
      new Date("2026-04-30T12:40:00Z"),
      "UTC",
    );

    expect(summary).toEqual({
      updatedAtLabel: "04-30 12:24",
      updatedAtTimestamp: "2026-04-30T12:24:03Z",
      rows: [
        {
          modelId: "mistral-small-2603",
          label: "mistral-small-latest::mistral-small-2603",
          inputTokens: 56,
          outputTokens: 6,
          cachedTokens: null,
        },
      ],
    });
  });

  it("shows compact monthly billing summary", () => {
    const summary = readMistralQuotaSummary(
      providerOwnerObservabilityModel(createItem(), "mistral-ai-6d5a5e"),
      new Date("2026-04-30T12:40:00Z"),
      "UTC",
    );

    expect(summary?.rows).toEqual([
      {
        id: "monthly-spend",
        label: "Monthly spend",
        value: "\u20ac1.2345",
        progressUnavailableLabel: "this month",
      },
      {
        id: "billing-cap",
        label: "Monthly billing cap",
        value: "\u20ac145 / \u20ac150",
        progressPercent: 145 / 150 * 100,
      },
    ]);
  });

  it("reads current billing cap metrics from cost_usd quota rows", () => {
    const summary = readMistralQuotaSummary(
      providerOwnerObservabilityModel(createCostUsdItem(), "mistral-ai-6d5a5e"),
      new Date("2026-05-01T06:00:00Z"),
      "UTC",
    );

    expect(summary?.rows).toEqual([
      {
        id: "monthly-spend",
        label: "Monthly spend",
        value: "No usage",
        progressUnavailableLabel: "this month",
      },
      {
        id: "billing-cap",
        label: "Monthly billing cap",
        value: "$150 / $150",
        progressPercent: 100,
      },
    ]);
  });

  it("reads detailed usage rows for the usage drawer", () => {
    const summary = readMistralUsageDetailsSummary(
      providerOwnerObservabilityModel(createItem(), "mistral-ai-6d5a5e"),
      new Date("2026-04-30T12:40:00Z"),
      "UTC",
    );

    expect(summary?.rows).toEqual([
      {
        id: "monthly-spend",
        label: "Monthly spend",
        value: "\u20ac1.2345",
        progressUnavailableLabel: "this month",
      },
      {
        id: "billing-cap",
        label: "Monthly billing cap",
        value: "\u20ac145 / \u20ac150",
        progressPercent: 145 / 150 * 100,
      },
      {
        id: "monthly-tokens",
        label: "Monthly tokens",
        value: "62",
        progressUnavailableLabel: "56 input · 6 output",
      },
      {
        id: "mistral-small-2603-usage-detail",
        label: "mistral-small-latest::mistral-small-2603",
        value: "\u20ac1.2345 · 62 / 4M",
        progressPercent: (4000000 - 62) / 4000000 * 100,
        progressUnavailableLabel: "56 input · 6 output",
        subtle: true,
      },
      {
        id: "devstral-2512-token-limit",
        label: "devstral-2512 token limit",
        value: "4M / 4M",
        progressPercent: 100,
        progressUnavailableLabel: "0 used · 50K / minute",
        subtle: true,
      },
      {
        id: "magistral-small-2509-token-limit",
        label: "magistral-small-2509 token limit",
        value: "1B / 1B",
        progressPercent: 100,
        progressUnavailableLabel: "0 used",
        subtle: true,
      },
      {
        id: "mistral-small-2603-token-limit",
        label: "mistral-small-2603 token limit",
        value: "4M / 4M",
        progressPercent: (4000000 - 62) / 4000000 * 100,
        progressUnavailableLabel: "62 used · 50K / minute",
        subtle: true,
      },
    ]);
  });
});

function createItem(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "mistral",
    lastProbeRun: [{ surfaceId: "mistral-ai-6d5a5e", timestamp: "2026-04-30T12:24:03Z" }],
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.usage.tokens.count",
        rows: [
          usageRow("input", 56),
          usageRow("output", 6),
        ],
      },
      {
        metricName: "gen_ai.provider.usage.cost",
        rows: [
          costRow("", "total", "all", 1.2345),
          costRow("mistral-small-2603", "model", "completion", 1.2345),
        ],
      },
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          quotaRow("", "cost", "month", 150, "billing_cap"),
          quotaRow("mistral-small-2603", "tokens", "month", 4000000),
          quotaRow("devstral-2512", "tokens", "month", 4000000),
          quotaRow("magistral-small-2509", "tokens", "month", 1000000000),
          quotaRow("mistral-small-2603", "tokens", "minute", 50000),
          quotaRow("devstral-2512", "tokens", "minute", 50000),
          quotaRow("mistral-small-2603", "requests", "second", 1),
        ],
      },
      {
        metricName: "gen_ai.provider.quota.usage",
        rows: [
          quotaRow("", "cost", "month", 5, "billing_cap"),
        ],
      },
      {
        metricName: "gen_ai.provider.quota.remaining",
        rows: [
          quotaRow("", "cost", "month", 145, "billing_cap"),
        ],
      },
    ],
  };
}

function createCostUsdItem(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "mistral",
    lastProbeRun: [{ surfaceId: "mistral-ai-6d5a5e", timestamp: "2026-05-01T05:12:03Z" }],
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          quotaRow("", "cost_usd", "month", 150, "billing_cap"),
        ],
      },
      {
        metricName: "gen_ai.provider.quota.usage",
        rows: [
          quotaRow("", "cost_usd", "month", 0, "billing_cap"),
        ],
      },
      {
        metricName: "gen_ai.provider.quota.remaining",
        rows: [
          quotaRow("", "cost_usd", "month", 150, "billing_cap"),
        ],
      },
    ],
  };
}

function usageRow(tokenType: string, value: number) {
  return {
    labels: {
      surface_id: "mistral-ai-6d5a5e",
      model_id: "mistral-small-2603",
      mistral_ai_billing_metric: "mistral-small-2603",
      model_label: "mistral-small-latest::mistral-small-2603",
      resource: "tokens",
      window: "month",
      token_type: tokenType,
      gen_ai_provider_name: "mistral_ai",
    },
    value,
  };
}

function costRow(modelId: string, scope: string, usageCategory: string, value: number) {
  return {
    labels: {
      surface_id: "mistral-ai-6d5a5e",
      ...(modelId ? { model_id: modelId } : {}),
      ...(modelId ? { mistral_ai_billing_metric: modelId } : {}),
      ...(modelId ? { model_label: "mistral-small-latest::mistral-small-2603" } : {}),
      resource: "cost",
      window: "month",
      scope,
      usage_category: usageCategory,
      currency: "EUR",
      currency_symbol: "\u20ac",
      gen_ai_provider_name: "mistral_ai",
    },
    value,
  };
}

function quotaRow(modelId: string, resource: string, window: string, value: number, poolId = "") {
  return {
    labels: {
      ...(modelId ? { model_id: modelId } : {}),
      ...(poolId ? { quota_pool_id: poolId } : {}),
      resource,
      window,
    },
    value,
  };
}

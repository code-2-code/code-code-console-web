import { describe, expect, it } from "vitest";
import type { ProviderOwnerObservabilityItem } from "../api";
import { providerOwnerObservabilityModel } from "../provider-owner-observability-model";
import { readGoogleAIStudioQuotaSummary } from "./provider-card-google-summary";

describe("provider-card-google-summary", () => {
  it("reads Google AI Studio RPD quota rows and reset time", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItem(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary).toEqual({
      tierLabel: null,
      updatedAtLabel: "04-19 08:00",
      updatedAtTimestamp: "2026-04-19T08:00:00Z",
      rows: [
        {
          id: "gemini-2.5-flash:REQUESTS:requests:day",
          label: "gemini-2.5-flash (Preview) · Requests",
          value: "7,200 / 10K",
          progressPercent: 72,
          resetAtLabel: "04-20 00:00",
          subtle: false,
        },
      ],
    });
  });

  it("does not expose tier label", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItemWithoutTierOnQuotaRows(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary?.tierLabel).toBeNull();
  });

  it("returns null when quota metrics are missing", () => {
    expect(readGoogleAIStudioQuotaSummary(providerOwnerObservabilityModel({ vendorId: "google" }, "instance-1"))).toBeNull();
  });

  it("shows only daily model quota rows", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItemWithManyRows(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary).not.toBeNull();
    const rows = summary?.rows || [];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "model-b:REQUESTS:requests:day",
      label: "model-b · Requests",
    });
    expect(rows[1]).toMatchObject({
      id: "model-b:TOKENS:tokens:day",
      label: "model-b · Tokens",
    });
  });

  it("skips unavailable zero-limit models", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItemWithZeroLimitRows(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary?.rows.map((row) => row.id)).toEqual(["model-live:REQUESTS:requests:day"]);
  });

  it("shows gemma quota rows when labeled as gemma", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItemWithGemmaRows(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary?.rows.map((row) => row.id)).toEqual(["gemma-3-1b:REQUESTS:requests:day"]);
  });

  it("prioritizes text output rows before gemma rows", () => {
    const summary = readGoogleAIStudioQuotaSummary(
      providerOwnerObservabilityModel(createGoogleQuotaItemWithTextAndGemmaRows(), "instance-1"),
      new Date("2026-04-19T09:00:00Z"),
      "UTC",
    );
    expect(summary?.rows.map((row) => row.id)).toEqual([
      "gemini-2.5-flash:REQUESTS:requests:day",
      "gemini-2.5-flash-lite:REQUESTS:requests:day",
      "gemini-3-flash:REQUESTS:requests:day",
      "gemini-3.1-flash-lite:REQUESTS:requests:day",
      "gemma-3-1b:REQUESTS:requests:day",
    ]);
  });
});

function createGoogleQuotaItem(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    lastProbeRun: [{ surfaceId: "instance-1", timestamp: "2026-04-19T08:00:00Z" }],
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          {
            labels: {
              vendor_id: "google",
              model_category: "text_output",
              model_id: "gemini-2.5-pro",
              resource: "requests",
              window: "minute",
              quota_type: "Requests",
              preview: "false",
              tier: "TIER_2",
            },
            value: 1500,
          },
          {
            labels: {
              vendor_id: "google",
              model_category: "text_output",
              model_id: "gemini-2.5-pro",
              resource: "tokens",
              window: "minute",
              quota_type: "Tokens",
              preview: "false",
              tier: "TIER_2",
            },
            value: 2_000_000,
          },
          {
            labels: {
              vendor_id: "google",
              model_category: "text_output",
              model_id: "gemini-2.5-flash",
              resource: "requests",
              window: "day",
              quota_type: "Requests",
              preview: "true",
              tier: "TIER_2",
            },
            value: 10_000,
          },
        ],
      },
      {
        metricName: "gen_ai.provider.quota.remaining",
        rows: [
          {
            labels: {
              vendor_id: "google",
              model_category: "text_output",
              model_id: "gemini-2.5-flash",
              resource: "requests",
              window: "day",
              quota_type: "Requests",
            },
            value: 7_200,
          },
        ],
      },
      {
        metricName: "gen_ai.provider.quota.reset.timestamp.seconds",
        rows: [
          {
            labels: {
              vendor_id: "google",
              model_category: "text_output",
              model_id: "gemini-2.5-flash",
              resource: "requests",
              window: "day",
              quota_type: "Requests",
            },
            value: 1_776_643_200,
          },
        ],
      },
    ],
  };
}

function createGoogleQuotaItemWithoutTierOnQuotaRows(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [{
          labels: {
            vendor_id: "google",
            model_category: "text_output",
            model_id: "gemini-2.5-flash",
            resource: "requests",
            window: "day",
            quota_type: "Requests",
          },
          value: 60,
        }],
      },
    ],
  };
}

function createGoogleQuotaItemWithManyRows(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    lastProbeRun: [{ surfaceId: "instance-1", timestamp: "2026-04-19T08:00:00Z" }],
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          {
            labels: textQuotaLabels({ model_id: "model-a", quota_type: "Requests", resource: "requests", window: "minute" }),
            value: 100,
          },
          {
            labels: textQuotaLabels({ model_id: "model-a", quota_type: "Tokens", resource: "tokens", window: "minute" }),
            value: 1000,
          },
          {
            labels: textQuotaLabels({ model_id: "model-b", quota_type: "Requests", resource: "requests", window: "day" }),
            value: 200,
          },
          {
            labels: textQuotaLabels({ model_id: "model-b", quota_type: "Tokens", resource: "tokens", window: "day" }),
            value: 3000,
          },
          {
            labels: textQuotaLabels({ model_id: "model-c", quota_type: "Requests", resource: "requests", window: "minute" }),
            value: 50,
          },
          {
            labels: textQuotaLabels({ model_id: "model-c", quota_type: "Tokens", resource: "tokens", window: "minute" }),
            value: 500,
          },
          {
            labels: textQuotaLabels({ model_id: "model-z", quota_type: "Images", resource: "images", window: "minute" }),
            value: 10,
          },
          {
            labels: textQuotaLabels({ model_id: "model-z", quota_type: "Videos", resource: "videos", window: "minute" }),
            value: 2,
          },
        ],
      },
    ],
  };
}

function createGoogleQuotaItemWithZeroLimitRows(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          {
            labels: textQuotaLabels({ model_id: "model-disabled", quota_type: "Requests", resource: "requests", window: "day" }),
            value: 0,
          },
          {
            labels: { vendor_id: "google", model_id: "model-legacy", quota_type: "Requests", resource: "requests", window: "day" },
            value: 999,
          },
          {
            labels: textQuotaLabels({ model_id: "model-live", quota_type: "Requests", resource: "requests", window: "day" }),
            value: 20,
          },
        ],
      },
    ],
  };
}

function createGoogleQuotaItemWithGemmaRows(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          {
            labels: { vendor_id: "google", model_category: "gemma", model_id: "gemma-3-1b", quota_type: "Requests", resource: "requests", window: "day" },
            value: 14_400,
          },
        ],
      },
    ],
  };
}

function createGoogleQuotaItemWithTextAndGemmaRows(): ProviderOwnerObservabilityItem {
  return {
    owner: "vendor",
    vendorId: "google",
    runtimeMetrics: [
      {
        metricName: "gen_ai.provider.quota.limit",
        rows: [
          { labels: textQuotaLabels({ model_id: "gemini-3-flash", quota_type: "Requests", resource: "requests", window: "day" }), value: 20 },
          { labels: textQuotaLabels({ model_id: "gemini-2.5-flash-lite", quota_type: "Requests", resource: "requests", window: "day" }), value: 20 },
          { labels: textQuotaLabels({ model_id: "gemini-3.1-flash-lite", quota_type: "Requests", resource: "requests", window: "day" }), value: 500 },
          { labels: textQuotaLabels({ model_id: "gemini-2.5-flash", quota_type: "Requests", resource: "requests", window: "day" }), value: 20 },
          { labels: { vendor_id: "google", model_category: "gemma", model_id: "gemma-3-4b", quota_type: "Requests", resource: "requests", window: "day" }, value: 14_400 },
          { labels: { vendor_id: "google", model_category: "gemma", model_id: "gemma-3-1b", quota_type: "Requests", resource: "requests", window: "day" }, value: 14_400 },
        ],
      },
    ],
  };
}

function textQuotaLabels(labels: Record<string, string>) {
  return { vendor_id: "google", model_category: "text_output", ...labels };
}

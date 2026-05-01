import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import { AgentResourcesSchema } from "@code-code/agent-contract/agent/v1/cap";
import { Protocol } from "@code-code/agent-contract/api-protocol/v1";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import { AgentSessionRuntimeConfigSchema } from "@code-code/agent-contract/platform/agent-session/v1";
import { sessionRuntimeProviderSelectItems, normalizeInlineDraftWithSessionRuntimeOptions, type SessionRuntimeOptions } from "./session-runtime-options";

describe("session runtime options", () => {
  it("keeps runtime selection blank before cli is selected", () => {
    const next = normalizeInlineDraftWithSessionRuntimeOptions(blankDraft(), runtimeOptions());

    expect(next.providerId).toBe("");
    expect(next.executionClass).toBe("");
    expect(next.runtimeConfig.providerId).toBe("");
    expect(next.runtimeConfig.endpoint).toBeUndefined();
    expect(next.runtimeConfig.primaryModelSelector).toBeUndefined();
  });

  it("hydrates dependent selections after cli change", () => {
    const next = normalizeInlineDraftWithSessionRuntimeOptions({
      ...blankDraft(),
      providerId: "codex",
    }, runtimeOptions());

    expect(next.providerId).toBe("codex");
    expect(next.executionClass).toBe("cli-standard");
    expect(next.runtimeConfig.providerId).toBe("openai-default");
    expect(next.runtimeConfig.primaryModelSelector?.selector.value).toBe("gpt-5");
  });

  it("switches model to the selected surface catalog", () => {
    const next = normalizeInlineDraftWithSessionRuntimeOptions({
      providerId: "codex",
      executionClass: "cli-long-context",
      runtimeConfig: create(AgentSessionRuntimeConfigSchema, {
        providerId: "openai-backup",
        endpoint: apiEndpoint("openai-backup"),
        primaryModelSelector: { selector: { case: "providerModelId", value: "gpt-5" } },
        fallbacks: [],
      }),
      resourceConfig: create(AgentResourcesSchema, {}),
    }, runtimeOptions());

    expect(next.runtimeConfig.providerId).toBe("openai-backup");
    expect(next.runtimeConfig.primaryModelSelector?.selector.value).toBe("gpt-5-mini");
  });

  it("excludes providers with no executionClasses from select items", () => {
    const items = sessionRuntimeProviderSelectItems(runtimeOptionsWithNoImageProvider());
    expect(items.map((i) => i.value)).toEqual(["codex"]);
    expect(items.find((i) => i.value === "no-image-cli")).toBeUndefined();
  });

  it("skips provider with no executionClasses when resolving fallback provider", () => {
    const next = normalizeInlineDraftWithSessionRuntimeOptions({
      ...blankDraft(),
      providerId: "no-image-cli",
    }, runtimeOptionsWithNoImageProvider());

    // should fall back to the first usable provider, not the one without images
    expect(next.providerId).toBe("codex");
    expect(next.executionClass).toBe("cli-standard");
  });
});

function blankDraft() {
  return {
    providerId: "",
    executionClass: "",
    runtimeConfig: create(AgentSessionRuntimeConfigSchema, { fallbacks: [] }),
    resourceConfig: create(AgentResourcesSchema, {}),
  };
}

function runtimeOptions(): SessionRuntimeOptions {
  return {
    items: [{
      providerId: "codex",
      label: "Codex",
      executionClasses: ["cli-standard", "cli-long-context"],
      surfaces: [
        {
          providerId: "openai-default",
          endpoint: apiEndpoint("openai-default"),
          label: "OpenAI Default",
          models: ["gpt-5", "gpt-5-mini"],
        },
        {
          providerId: "openai-backup",
          endpoint: apiEndpoint("openai-backup"),
          label: "OpenAI Backup",
          models: ["gpt-5-mini"],
        },
      ],
    }],
  };
}

function runtimeOptionsWithNoImageProvider(): SessionRuntimeOptions {
  return {
    items: [
      {
        providerId: "no-image-cli",
        label: "No Image CLI",
        executionClasses: [],
        surfaces: [],
      },
      {
        providerId: "codex",
        label: "Codex",
        executionClasses: ["cli-standard"],
        surfaces: [
          {
            providerId: "openai-default",
            endpoint: apiEndpoint("openai-default"),
            label: "OpenAI Default",
            models: ["gpt-5"],
          },
        ],
      },
    ],
  };
}

function apiEndpoint(providerId: string): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: {
        baseUrl: `https://${providerId}.test/v1`,
        protocol: Protocol.OPENAI_COMPATIBLE,
      },
    },
  } as ProviderEndpoint;
}

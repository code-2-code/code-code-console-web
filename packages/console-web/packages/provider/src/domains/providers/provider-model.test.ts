import { describe, expect, it } from "vitest";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import { ProviderProtocol, type ProviderProtocolValue } from "./provider-protocol";
import { registerDefaultProviderProtocolPresentations } from "./provider-protocol-presentation-store";
import { providerModel } from "./provider-model";

describe("provider-model", () => {
  it("derives model and status summaries from the flat provider view", () => {
    const model = providerModel(provider({
      providerId: "provider-openai",
      displayName: "OpenAI",
      providerCredentialId: "cred-openai",
      models: [
        { providerModelId: "gpt-4.1" },
        { providerModelId: "gpt-4.1-mini" },
        { providerModelId: "o4-mini" },
      ],
      surfaceId: "surface-a",
      endpoints: [apiEndpoint(ProviderProtocol.OPENAI_RESPONSES)],
      status: {
        phase: ProviderPhase.REFRESHING,
      },
    }));

    expect(model.modelCount()).toBe(3);
    expect(model.modelsSummary()).toBe("3 models");
    expect(model.status()).toMatchObject({
      color: "amber",
      label: "Refreshing",
      reason: "",
    });
  });

  it("hides ready reason for a ready provider", () => {
    const model = providerModel(provider({
      providerId: "provider-openai",
      displayName: "OpenAI",
      surfaceId: "surface-a",
      endpoints: [],
      models: [],
      status: {
        phase: ProviderPhase.READY,
        reason: "Provider surface configuration is valid.",
      },
    }));

    expect(model.status()).toMatchObject({
      color: "green",
      label: "Ready",
      reason: "",
    });
  });

  it("formats provider protocol labels for cards", () => {
    registerDefaultProviderProtocolPresentations();
    const model = providerModel(provider({
      surfaceId: "surface-a",
      endpoints: [apiEndpoint(ProviderProtocol.OPENAI_COMPATIBLE, "https://api.example.com/v1")],
      models: [],
    }));

    expect(model.protocolLabels()).toEqual(["OpenAI Compatible"]);
  });

  it("does not render synthetic api details for cli oauth cards", () => {
    const model = providerModel(provider({
      surfaceId: "surface-cli",
      endpoints: [cliEndpoint("codex")],
      models: [],
    }));

    expect(model.protocolLabels()).toEqual([]);
  });
});

function apiEndpoint(protocol: ProviderProtocolValue, baseUrl = ""): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: { protocol, baseUrl },
    },
  } as ProviderEndpoint;
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

function provider(providerView: Partial<ProviderView>): ProviderView {
  return providerView as ProviderView;
}

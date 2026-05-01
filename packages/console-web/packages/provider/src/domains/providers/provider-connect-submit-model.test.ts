import { create } from "@bufbuild/protobuf";
import {
  ConnectProviderResponseSchema,
  ProviderViewSchema,
} from "@code-code/agent-contract/platform/management/v1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectProviderWithCustomAPIKey, connectProviderWithSurfaceAPIKey } from "./api";
import { type ProviderConnectFormValues } from "./provider-connect-form-model";
import { confirmProviderAPIKeyConnect } from "./provider-connect-submit-model";

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    connectProviderWithCustomAPIKey: vi.fn(),
    connectProviderWithSurfaceAPIKey: vi.fn(),
  };
});

const connectProviderWithCustomAPIKeyMock = vi.mocked(connectProviderWithCustomAPIKey);
const connectProviderWithSurfaceAPIKeyMock = vi.mocked(connectProviderWithSurfaceAPIKey);

describe("provider connect submit model", () => {
  beforeEach(() => {
    connectProviderWithCustomAPIKeyMock.mockReset();
    connectProviderWithSurfaceAPIKeyMock.mockReset();
  });

  it("forwards api key surface connect payload", async () => {
    connectProviderWithSurfaceAPIKeyMock.mockResolvedValue(create(ConnectProviderResponseSchema, {
      outcome: {
        case: "provider",
        value: create(ProviderViewSchema, { providerId: "provider-openai" }),
      },
    }));

    const provider = await confirmProviderAPIKeyConnect(
      {
        id: "surface:openai-compatible",
        kind: "surfaceApiKey",
        displayName: "OpenAI",
        prefilledSurfaces: [{
          surfaceId: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          protocol: 1,
          parameterKeys: [],
        }],
      },
      {
        connectOptionId: "surface:openai-compatible",
        displayName: "OpenAI",
        apiKey: "sk-openai",
        baseUrl: "",
        protocol: "",
        surfaceParameters: {},
      } satisfies ProviderConnectFormValues,
    );

    expect(connectProviderWithSurfaceAPIKeyMock).toHaveBeenCalledWith(expect.objectContaining({
      surfaceId: "openai-compatible",
      apiKey: "sk-openai",
    }));
    expect(provider?.providerId).toBe("provider-openai");
  });

  it("forwards custom api key surface", async () => {
    connectProviderWithCustomAPIKeyMock.mockResolvedValue(create(ConnectProviderResponseSchema, {
      outcome: {
        case: "provider",
        value: create(ProviderViewSchema, { providerId: "provider-custom" }),
      },
    }));

    const provider = await confirmProviderAPIKeyConnect(
      {
        id: "custom-api-key",
        kind: "customApiKey",
        displayName: "Custom API Key",
        surfaceId: "custom.api",
      },
      {
        connectOptionId: "custom-api-key",
        displayName: "Custom API Key",
        apiKey: "sk-custom",
        baseUrl: "https://api.custom.example/v1",
        protocol: "1",
        surfaceParameters: {},
      } satisfies ProviderConnectFormValues,
    );

    expect(connectProviderWithCustomAPIKeyMock).toHaveBeenCalledWith(expect.objectContaining({
      surfaceId: "custom.api",
      baseUrl: "https://api.custom.example/v1",
      apiKey: "sk-custom",
    }));
    expect(provider?.providerId).toBe("provider-custom");
  });

  it("resolves templated surface base url", async () => {
    connectProviderWithSurfaceAPIKeyMock.mockResolvedValue(create(ConnectProviderResponseSchema, {
      outcome: {
        case: "provider",
        value: create(ProviderViewSchema, { providerId: "provider-cloudflare" }),
      },
    }));

    const provider = await confirmProviderAPIKeyConnect(
      {
        id: "surface:cloudflare-workers-ai",
        kind: "surfaceApiKey",
        displayName: "Cloudflare Workers AI",
        prefilledSurfaces: [{
          surfaceId: "cloudflare-workers-ai",
          baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1",
          protocol: 1,
          parameterKeys: ["account_id"],
        }],
      },
      {
        connectOptionId: "surface:cloudflare-workers-ai",
        displayName: "Cloudflare Workers AI",
        apiKey: "cf-api-key",
        baseUrl: "",
        protocol: "",
        surfaceParameters: {
          account_id: "04d289f3ff972711c415793f0b7da61d",
        },
      } satisfies ProviderConnectFormValues,
    );

    expect(connectProviderWithSurfaceAPIKeyMock).toHaveBeenCalledWith(expect.objectContaining({
      surfaceId: "cloudflare-workers-ai",
      apiKey: "cf-api-key",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/04d289f3ff972711c415793f0b7da61d/ai/v1",
    }));
    expect(provider?.providerId).toBe("provider-cloudflare");
  });
});

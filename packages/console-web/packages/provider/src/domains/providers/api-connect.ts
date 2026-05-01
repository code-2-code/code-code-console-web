import { create, fromJson, toJson, type JsonValue } from "@bufbuild/protobuf";
import {
	ConnectProviderRequestSchema,
	ConnectProviderResponseSchema,
	GetProviderConnectSessionResponseSchema,
	type ConnectProviderRequest,
	type ConnectProviderResponse,
	type ProviderConnectSessionView,
} from "@code-code/agent-contract/platform/management/v1";
import { ProviderAddMethod } from "@code-code/agent-contract/platform/provider/v1/shared";
import useSWR from "swr";
import { jsonFetcher, jsonRequest, protobufJsonReadOptions } from "@code-code/console-web-ui";

import {
  type ConnectProviderWithCustomAPIKeyDraft,
  type ConnectProviderWithOAuthDraft,
  type ConnectProviderWithSurfaceAPIKeyDraft,
} from "./api-types";

const providerConnectPath = "/api/providers/connect";

export async function connectProviderWithSurfaceAPIKey(draft: ConnectProviderWithSurfaceAPIKeyDraft): Promise<ConnectProviderResponse> {
  const request = create(ConnectProviderRequestSchema, {
    addMethod: ProviderAddMethod.API_KEY,
    surfaceId: draft.surfaceId,
    displayName: draft.displayName ?? "",
    authMaterial: {
      case: "apiKey",
      value: {
        apiKey: draft.apiKey,
        baseUrl: draft.baseUrl ?? "",
      },
    },
  });
  return submitConnectProvider(request);
}

export async function connectProviderWithCustomAPIKey(draft: ConnectProviderWithCustomAPIKeyDraft): Promise<ConnectProviderResponse> {
  const request = create(ConnectProviderRequestSchema, {
    addMethod: ProviderAddMethod.API_KEY,
    surfaceId: draft.surfaceId,
    displayName: draft.displayName ?? "",
    authMaterial: {
      case: "apiKey",
      value: {
        apiKey: draft.apiKey,
        baseUrl: draft.baseUrl,
        protocol: draft.protocol,
      },
    },
  });
  return submitConnectProvider(request);
}

export async function connectProviderWithOAuth(draft: ConnectProviderWithOAuthDraft): Promise<ConnectProviderResponse> {
  const request = create(ConnectProviderRequestSchema, {
    addMethod: ProviderAddMethod.CLI_OAUTH,
    surfaceId: draft.surfaceId,
    displayName: draft.displayName ?? "",
    authMaterial: {
      case: "cliOauth",
      value: {},
    },
  });
  const data = await jsonRequest<JsonValue>(providerConnectPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toJson(ConnectProviderRequestSchema, request)),
  });
  return fromJson(ConnectProviderResponseSchema, data, protobufJsonReadOptions);
}

export function useProviderConnectSession(sessionId?: string) {
  const key = sessionId ? `${providerConnectPath}/sessions/${encodeURIComponent(sessionId)}` : null;
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(key, jsonFetcher<JsonValue>);
  const response = data ? fromJson(GetProviderConnectSessionResponseSchema, data, protobufJsonReadOptions) : undefined;
  return {
    session: response?.session as ProviderConnectSessionView | undefined,
    error,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}

async function submitConnectProvider(request: ConnectProviderRequest): Promise<ConnectProviderResponse> {
  const data = await jsonRequest<JsonValue>(providerConnectPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toJson(ConnectProviderRequestSchema, request)),
  });
  return fromJson(ConnectProviderResponseSchema, data, protobufJsonReadOptions);
}

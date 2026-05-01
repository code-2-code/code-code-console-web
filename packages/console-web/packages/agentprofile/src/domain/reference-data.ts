import { fromJson, type JsonValue } from "@bufbuild/protobuf";
import {
  GetSessionRuntimeOptionsResponseSchema,
} from "@code-code/agent-contract/platform/chat/v1";
import {
  ListCLIsResponseSchema,
  ListProductInfosResponseSchema,
  type CLI,
  type Surface,
} from "@code-code/agent-contract/platform/support/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import {
  ListProviderSurfacesResponseSchema,
  ListProvidersResponseSchema,
} from "@code-code/agent-contract/platform/management/v1";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import { useMemo } from "react";
import useSWR from "swr";
import { jsonFetcher, protobufJsonReadOptions } from "@code-code/console-web-ui";
import { EMPTY_SESSION_RUNTIME_OPTIONS, type CLIReference, type SessionRuntimeOptions } from "./types";

const providersPath = "/api/providers";
const providerSurfacesPath = "/api/providers/surfaces";
const clisPath = "/api/support/clis";
const productInfosPath = "/api/support/product-infos";
const sessionRuntimeOptionsPath = "/api/chats/session-runtime-options";

export function useProviders() {
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(providersPath, jsonFetcher<JsonValue>);
  const response = data ? fromJson(ListProvidersResponseSchema, data, protobufJsonReadOptions) : undefined;
  return {
    providers: response?.items || ([] as ProviderView[]),
    isLoading,
    isError: Boolean(error),
    error,
    mutate
  };
}

export function useProviderSurfaces() {
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(providerSurfacesPath, jsonFetcher<JsonValue>);
  const response = data ? fromJson(ListProviderSurfacesResponseSchema, data, protobufJsonReadOptions) : undefined;
  return {
    surfaces: response?.items || ([] as Surface[]),
    isLoading,
    isError: Boolean(error),
    error,
    mutate
  };
}

export function useProductInfos() {
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(productInfosPath, jsonFetcher<JsonValue>);
  const response = data ? fromJson(ListProductInfosResponseSchema, data, protobufJsonReadOptions) : undefined;
  return {
    productInfos: response?.items || ([] as ProductInfo[]),
    isLoading,
    isError: Boolean(error),
    error,
    mutate
  };
}

export function useCLIReferences() {
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(clisPath, jsonFetcher<JsonValue>);
  const response = data ? fromJson(ListCLIsResponseSchema, data, protobufJsonReadOptions) : undefined;
  return {
    clis: (response?.items || ([] as CLI[])).map(toCLIReference),
    isLoading,
    isError: Boolean(error),
    error,
    mutate
  };
}

export function useSessionRuntimeOptions() {
  const { data, error, isLoading, mutate } = useSWR<JsonValue>(sessionRuntimeOptionsPath, jsonFetcher<JsonValue>);
  const sessionRuntimeOptions = useMemo(
    () => data ? fromJson(GetSessionRuntimeOptionsResponseSchema, data, protobufJsonReadOptions) : EMPTY_SESSION_RUNTIME_OPTIONS,
    [data],
  );
  return {
    sessionRuntimeOptions,
    isLoading,
    isError: Boolean(error),
    error,
    mutate
  };
}

function toCLIReference(item: CLI): CLIReference {
  return {
    cliId: item.cliId,
    displayName: item.displayName || item.cliId,
    iconUrl: item.iconUrl,
    supportedProviderTypes: item.apiKeyProtocols.map((entry) => Number(entry.protocol))
  };
}

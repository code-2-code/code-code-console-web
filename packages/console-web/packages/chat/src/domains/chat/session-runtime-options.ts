import { create } from "@bufbuild/protobuf";
import { ProviderEndpointSchema, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import {
  AgentSessionRuntimeConfigSchema,
  AgentSessionRuntimeFallbackCandidateSchema,
  type AgentSessionRuntimeConfig,
  type AgentSessionRuntimeFallbackCandidate,
} from "@code-code/agent-contract/platform/agent-session/v1";
import { createProviderFallbackModelSelector, createProviderModelSelector, runtimeFallbackModelId, runtimePrimaryModelId } from "./runtime-model-selector";
import type { ChatInlineSetup } from "./types";

export type SessionRuntimeOptions = {
  items: SessionRuntimeProviderOption[];
};

export type SessionRuntimeProviderOption = {
  providerId: string;
  label: string;
  executionClasses: string[];
  surfaces: SessionRuntimeSurfaceOption[];
};

export type SessionRuntimeSurfaceOption = {
  providerId: string;
  endpoint?: ProviderEndpoint;
  label: string;
  models: string[];
};

export const EMPTY_SESSION_RUNTIME_OPTIONS: SessionRuntimeOptions = { items: [] };

export function sessionRuntimeProviderSelectItems(options: SessionRuntimeOptions) {
  return options.items
    .filter((item) => item.executionClasses.length > 0)
    .map((item) => ({ value: item.providerId, label: item.label }));
}

export function sessionRuntimeExecutionClassSelectItems(provider: SessionRuntimeProviderOption | null) {
  return (provider?.executionClasses || []).map((value) => ({ value, label: value }));
}

export function sessionRuntimeSurfaceSelectItems(provider: SessionRuntimeProviderOption | null) {
  return (provider?.surfaces || []).map((item) => ({ value: runtimeSurfaceKey(item), label: item.label }));
}

export function sessionRuntimeModelSelectItems(surface: SessionRuntimeSurfaceOption | null) {
  return (surface?.models || []).map((value) => ({ value, label: value }));
}

export function findSessionRuntimeProvider(options: SessionRuntimeOptions, providerId: string) {
  return options.items.find((item) => item.providerId === providerId) ?? null;
}

export function findSessionRuntimeSurface(provider: SessionRuntimeProviderOption | null, selection: string | RuntimeSelection | null | undefined) {
  const key = typeof selection === "string" ? selection : runtimeSelectionKey(selection?.providerId || "", selection?.endpoint);
  return provider?.surfaces.find((item) => runtimeSurfaceKey(item) === key) ?? null;
}

export function normalizeInlineDraftWithSessionRuntimeOptions(draft: ChatInlineSetup, options: SessionRuntimeOptions): ChatInlineSetup {
  const provider = resolveProviderOption(options, draft.providerId);
  if (!provider) {
    return clearRuntimeSelection(draft);
  }

  const primarySurface = resolveSurfaceOption(provider, draft.runtimeConfig);
  const primaryModelId = resolveModelId(primarySurface, runtimePrimaryModelId(draft.runtimeConfig.primaryModelSelector));

  return {
    ...draft,
    providerId: provider.providerId,
    executionClass: provider.executionClasses.includes(draft.executionClass) ? draft.executionClass : (provider.executionClasses[0] || ""),
    runtimeConfig: create(AgentSessionRuntimeConfigSchema, {
      ...draft.runtimeConfig,
      providerId: primarySurface?.providerId || "",
      endpoint: primarySurface?.endpoint ? cloneProviderEndpoint(primarySurface.endpoint) : undefined,
      primaryModelSelector: primaryModelId ? createProviderModelSelector(primaryModelId) : undefined,
      fallbacks: draft.runtimeConfig.fallbacks
        .map((item) => normalizeFallbackCandidate(item, provider))
        .filter((item) => item !== null),
    }),
  };
}

export function defaultRuntimeModelId(surface: SessionRuntimeSurfaceOption | null) {
  return surface?.models[0] || "";
}

function clearRuntimeSelection(draft: ChatInlineSetup): ChatInlineSetup {
  return {
    ...draft,
    providerId: "",
    executionClass: "",
    runtimeConfig: create(AgentSessionRuntimeConfigSchema, {
      ...draft.runtimeConfig,
      providerId: "",
      endpoint: undefined,
      primaryModelSelector: undefined,
      fallbacks: [],
    }),
  };
}

function resolveProviderOption(options: SessionRuntimeOptions, providerId: string) {
  const normalizedProviderId = providerId.trim();
  if (!normalizedProviderId) {
    return null;
  }
  const usable = options.items.filter((item) => item.executionClasses.length > 0);
  const found = findSessionRuntimeProvider(options, normalizedProviderId);
  if (found && found.executionClasses.length > 0) {
    return found;
  }
  return usable[0] || null;
}

function resolveSurfaceOption(provider: SessionRuntimeProviderOption, selection: RuntimeSelection | undefined) {
  const key = runtimeSelectionKey(selection?.providerId || "", selection?.endpoint);
  if (!key) {
    return provider.surfaces[0] || null;
  }
  return findSessionRuntimeSurface(provider, key) || provider.surfaces[0] || null;
}

function resolveModelId(surface: SessionRuntimeSurfaceOption | null, modelId: string) {
  const normalizedModelId = modelId.trim();
  if (!surface) {
    return "";
  }
  if (normalizedModelId && surface.models.includes(normalizedModelId)) {
    return normalizedModelId;
  }
  return defaultRuntimeModelId(surface);
}

function normalizeFallbackCandidate(
  item: ChatInlineSetup["runtimeConfig"]["fallbacks"][number],
  provider: SessionRuntimeProviderOption,
) {
  const surface = resolveSurfaceOption(provider, item);
  const modelId = resolveModelId(surface, runtimeFallbackModelId(item));
  if (!surface || !modelId) {
    return null;
  }
  return create(AgentSessionRuntimeFallbackCandidateSchema, {
    ...item,
    providerId: surface.providerId,
    endpoint: surface.endpoint ? cloneProviderEndpoint(surface.endpoint) : undefined,
    modelSelector: createProviderFallbackModelSelector(modelId),
  });
}

type RuntimeSelection = {
  providerId?: string;
  endpoint?: ProviderEndpoint;
};

export function runtimeConfigSelectionKey(config: AgentSessionRuntimeConfig | null | undefined) {
  return runtimeSelectionKey(config?.providerId || "", config?.endpoint);
}

export function runtimeFallbackSelectionKey(candidate: AgentSessionRuntimeFallbackCandidate | null | undefined) {
  return runtimeSelectionKey(candidate?.providerId || "", candidate?.endpoint);
}

export function runtimeSurfaceKey(surface: SessionRuntimeSurfaceOption | null | undefined) {
  return runtimeSelectionKey(surface?.providerId || "", surface?.endpoint);
}

function endpointKey(endpoint: ProviderEndpoint | null | undefined) {
  if (!endpoint) {
    return "";
  }
  const parts: string[] = [];
  switch (endpoint.shape.case) {
    case "api":
      parts.push("api", String(endpoint.shape.value.protocol || 0), endpoint.shape.value.baseUrl?.trim() || "");
      break;
    case "cli":
      parts.push("cli", endpoint.shape.value.cliId?.trim() || "");
      break;
    default:
      parts.push("unspecified");
      break;
  }
  return parts.join("\u0000");
}

export function runtimeSelectionKey(providerId: string, endpoint: ProviderEndpoint | null | undefined) {
  const key = endpointKey(endpoint);
  if (!providerId.trim() || !key) {
    return "";
  }
  return [providerId.trim(), key].join("\u0000");
}

export function cloneProviderEndpoint(endpoint: ProviderEndpoint) {
  return create(ProviderEndpointSchema, endpoint);
}

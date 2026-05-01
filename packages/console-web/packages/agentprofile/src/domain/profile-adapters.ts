import type { AgentProfile } from "@code-code/agent-contract/platform/agent-profile/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { Surface } from "@code-code/agent-contract/platform/support/v1";
import type { AgentProfileDraft, CLIReference, FallbackAvailability, FallbackProviderOption, ProviderType, SelectionFallback, SessionRuntimeOptions } from "./types";
import {
  PROVIDER_TYPE_ANTHROPIC,
  PROVIDER_TYPE_GEMINI,
  PROVIDER_TYPE_OPENAI_COMPATIBLE,
  PROVIDER_TYPE_OPENAI_RESPONSES
} from "./types";

type AgentFallbackMessage = NonNullable<NonNullable<AgentProfile["selectionStrategy"]>["fallbacks"]>[number];

export function createDraftProfile(sessionRuntimeOptions: SessionRuntimeOptions): AgentProfileDraft {
  const provider = firstSessionRuntimeProvider(sessionRuntimeOptions);
  return {
    profileId: "",
    name: "New Profile",
    selectionStrategy: {
      cliId: provider?.providerId || "",
      executionClass: provider?.executionClasses[0] || "",
      fallbackChain: []
    },
    mcpIds: [],
    skillIds: [],
    ruleIds: []
  };
}

export function cloneDraft(draft: AgentProfileDraft): AgentProfileDraft {
  return {
    ...draft,
    selectionStrategy: {
      ...draft.selectionStrategy,
      fallbackChain: draft.selectionStrategy.fallbackChain.map((item) => ({ ...item }))
    },
    mcpIds: [...draft.mcpIds],
    skillIds: [...draft.skillIds],
    ruleIds: [...draft.ruleIds]
  };
}

export function agentProfileToDraft(
  profile: AgentProfile,
  providers: ProviderView[],
  surfaces: Surface[],
  productInfos: ProductInfo[],
  sessionRuntimeOptions: SessionRuntimeOptions,
): AgentProfileDraft {
  const providerId = profile.selectionStrategy?.providerId || "";
  return {
    profileId: profile.profileId,
    name: profile.name,
    selectionStrategy: {
      cliId: providerId,
      executionClass: profile.selectionStrategy?.executionClass || defaultExecutionClass(sessionRuntimeOptions, providerId),
      fallbackChain: (profile.selectionStrategy?.fallbacks || []).map((item) => fallbackFromMessage(item, providers, surfaces, productInfos))
    },
    mcpIds: [...profile.mcpIds],
    skillIds: [...profile.skillIds],
    ruleIds: [...profile.ruleIds]
  };
}

export function draftToAgentProfileRequest(draft: AgentProfileDraft) {
  return {
    profileId: draft.profileId,
    name: draft.name.trim(),
    selectionStrategy: {
      providerId: draft.selectionStrategy.cliId,
      executionClass: draft.selectionStrategy.executionClass,
      fallbacks: draft.selectionStrategy.fallbackChain.map((item) => ({
        providerId: item.providerId,
        endpoint: item.endpoint,
        modelSelector: { case: "providerModelId" as const, value: item.modelId }
      }))
    },
    mcpIds: draft.mcpIds,
    skillIds: draft.skillIds,
    ruleIds: draft.ruleIds
  };
}

export function resolveCLI(cliId: string, clis: CLIReference[]) {
  return clis.find((item) => item.cliId === cliId) ?? null;
}

export function sessionRuntimeProviderSelectItems(sessionRuntimeOptions: SessionRuntimeOptions, currentCliId: string, clis: CLIReference[]) {
  const labels = new Map(clis.map((item) => [item.cliId, item.displayName]));
  const items = sessionRuntimeOptions.items
    .filter((item) => item.executionClasses.length > 0)
    .map((item) => ({
      value: item.providerId,
      label: item.label || labels.get(item.providerId) || item.providerId,
    }));
  if (currentCliId && !items.some((item) => item.value === currentCliId)) {
    items.push({ value: currentCliId, label: labels.get(currentCliId) || currentCliId });
  }
  return items;
}

export function sessionRuntimeExecutionClassSelectItems(sessionRuntimeOptions: SessionRuntimeOptions, cliId: string, currentExecutionClass: string) {
  const provider = sessionRuntimeOptions.items.find((item) => item.providerId === cliId);
  const items = (provider?.executionClasses || []).map((value) => ({ value, label: value }));
  if (currentExecutionClass && !items.some((item) => item.value === currentExecutionClass)) {
    items.push({ value: currentExecutionClass, label: currentExecutionClass });
  }
  return items;
}

export function defaultExecutionClass(sessionRuntimeOptions: SessionRuntimeOptions, cliId: string) {
  return sessionRuntimeOptions.items.find((item) => item.providerId === cliId)?.executionClasses[0] || "";
}

export function buildFallbackProviderOptions(
  providers: ProviderView[],
  surfaces: Surface[],
  productInfos: ProductInfo[],
  sessionRuntimeOptions: SessionRuntimeOptions,
  cliId: string,
  currentChain: SelectionFallback[]
) {
  const runtimeProvider = sessionRuntimeOptions.items.find((item) => item.providerId === cliId);
  const providerMap = new Map(providers.map((item) => [item.providerId, item]));
  const selected = new Set(currentChain.map((item) => fallbackKey(item.providerId, item.endpoint, item.modelId)));
  const groups = new Map<string, FallbackProviderOption>();
  for (const runtimeSurface of runtimeProvider?.surfaces || []) {
    const provider = providerMap.get(runtimeSurface.providerId);
    if (!provider || !runtimeSurface.endpoint) {
      continue;
    }
    const surfaceOption = toSurfaceOption(provider, runtimeSurface, selected);
    if (surfaceOption.models.length === 0) {
      continue;
    }
    const product = productInfoForProvider(provider, surfaces, productInfos);
    const groupID = provider.providerId;
    const current = groups.get(groupID);
    if (current) {
      current.surfaces.push(surfaceOption);
      continue;
    }
    groups.set(groupID, {
      id: groupID,
      productId: product.productId,
      label: providerLabel(provider),
      iconUrl: product.iconUrl,
      productLabel: product.label,
      surfaces: [surfaceOption]
    });
  }
  return Array.from(groups.values())
    .map((item) => ({ ...item, surfaces: item.surfaces.sort((left, right) => left.label.localeCompare(right.label)) }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function firstSessionRuntimeProvider(sessionRuntimeOptions: SessionRuntimeOptions) {
  return sessionRuntimeOptions.items.find((item) => item.executionClasses.length > 0) || null;
}

export function providerTypeLabel(providerType: ProviderType) {
  switch (providerType) {
    case PROVIDER_TYPE_OPENAI_RESPONSES:
      return "OpenAI Responses";
    case PROVIDER_TYPE_OPENAI_COMPATIBLE:
      return "OpenAI Compatible";
    case PROVIDER_TYPE_ANTHROPIC:
      return "Anthropic";
    case PROVIDER_TYPE_GEMINI:
      return "Gemini";
    default:
      return "Unknown";
  }
}

function fallbackFromMessage(
  item: AgentFallbackMessage,
  providers: ProviderView[],
  surfaces: Surface[],
  productInfos: ProductInfo[],
): SelectionFallback {
  const provider = providers.find((current) => current.providerId === item.providerId);
  const product = provider ? productInfoForProvider(provider, surfaces, productInfos) : emptyProductInfo();
  const modelId = item.modelSelector.case === "providerModelId" ? item.modelSelector.value : item.modelSelector.value?.modelId || "";
  const providerId = item.providerId || "missing";
  return {
    id: fallbackKey(providerId, item.endpoint, modelId),
    providerId,
    endpoint: item.endpoint,
    productId: product.productId,
    productLabel: product.label,
    providerLabel: provider ? providerLabel(provider) : providerId,
    providerIconUrl: product.iconUrl,
    providerType: endpointProtocol(item.endpoint),
    surfaceLabel: endpointLabel(item.endpoint, provider?.displayName || providerId),
    modelId,
    availability: availabilityFromPhase(provider?.status?.phase)
  };
}

function toSurfaceOption(
  provider: ProviderView,
  runtimeSurface: NonNullable<SessionRuntimeOptions["items"][number]["surfaces"]>[number],
  selected: Set<string>,
) {
  const availability = availabilityFromPhase(provider.status?.phase);
  const endpoint = runtimeSurface.endpoint;
  const models = Array.from(new Set(runtimeSurface.models))
    .filter((modelId) => !selected.has(fallbackKey(runtimeSurface.providerId, endpoint, modelId)))
    .map((modelId) => ({ id: fallbackKey(runtimeSurface.providerId, endpoint, modelId), modelId, availability }));
  return {
    id: `${runtimeSurface.providerId}:${endpointKey(endpoint)}`,
    providerId: runtimeSurface.providerId,
    endpoint,
    label: runtimeSurface.label || endpointLabel(endpoint, providerLabel(provider)),
    providerType: endpointProtocol(endpoint),
    availability,
    models
  };
}

function providerLabel(provider: ProviderView) {
  return provider.displayName || provider.providerId;
}

function productInfoForProvider(provider: ProviderView, surfaces: Surface[], productInfos: ProductInfo[]) {
  const surface = surfaces.find((item) => item.surfaceId === provider.surfaceId);
  const productId = surface?.productInfoId || "";
  const productInfo = productInfos.find((item) => item.id === productId);
  return {
    productId,
    label: productInfo?.displayName || productId || "Unknown product",
    iconUrl: productInfo?.iconUrl || "",
  };
}

function emptyProductInfo() {
  return { productId: "", label: "Unknown product", iconUrl: "" };
}

function endpointProtocol(endpoint: ProviderEndpoint | undefined): ProviderType {
  return Number(endpoint?.shape.case === "api" ? endpoint.shape.value.protocol : 0);
}

function endpointLabel(endpoint: ProviderEndpoint | undefined, fallback: string) {
  if (endpoint?.shape.case === "api") {
    return providerTypeLabel(Number(endpoint.shape.value.protocol));
  }
  if (endpoint?.shape.case === "cli") {
    return endpoint.shape.value.cliId || fallback;
  }
  return fallback;
}

function fallbackKey(providerId: string, endpoint: ProviderEndpoint | undefined, modelId: string) {
  return `${providerId}:${endpointKey(endpoint)}:${modelId}`;
}

function endpointKey(endpoint: ProviderEndpoint | undefined) {
  if (endpoint?.shape.case === "api") {
    return `api:${endpoint.shape.value.protocol}:${endpoint.shape.value.baseUrl}`;
  }
  if (endpoint?.shape.case === "cli") {
    return `cli:${endpoint.shape.value.cliId}`;
  }
  return "endpoint:missing";
}

function availabilityFromPhase(phase?: ProviderPhase): FallbackAvailability {
  switch (phase) {
    case ProviderPhase.READY:
      return "available";
    case ProviderPhase.REFRESHING:
    case ProviderPhase.STALE:
      return "degraded";
    default:
      return "unavailable";
  }
}

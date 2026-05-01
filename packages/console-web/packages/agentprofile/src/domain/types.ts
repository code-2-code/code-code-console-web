import type { ProviderEndpoint } from "@code-code/agent-contract/provider/v1";

export type MCPTransport = "stdio" | "streamable-http";

export type FallbackAvailability = "available" | "degraded" | "unavailable";

export type ProviderType = number;

export const PROVIDER_TYPE_UNSPECIFIED = 0;
export const PROVIDER_TYPE_OPENAI_RESPONSES = 1;
export const PROVIDER_TYPE_OPENAI_COMPATIBLE = 2;
export const PROVIDER_TYPE_ANTHROPIC = 3;
export const PROVIDER_TYPE_GEMINI = 4;

export type CLIReference = {
  cliId: string;
  displayName: string;
  iconUrl: string;
  supportedProviderTypes: ProviderType[];
};

export type SessionRuntimeProviderOption = {
  providerId: string;
  label: string;
  executionClasses: string[];
  surfaces: SessionRuntimeSurfaceOption[];
};

export type SessionRuntimeSurfaceOption = {
  providerId: string;
  label: string;
  models: string[];
  endpoint?: ProviderEndpoint;
};

export type SessionRuntimeOptions = {
  items: SessionRuntimeProviderOption[];
};

export const EMPTY_SESSION_RUNTIME_OPTIONS: SessionRuntimeOptions = { items: [] };

export type SelectionFallback = {
  id: string;
  providerId: string;
  endpoint?: ProviderEndpoint;
  productId: string;
  productLabel: string;
  providerLabel: string;
  providerIconUrl: string;
  providerType: ProviderType;
  surfaceLabel: string;
  modelId: string;
  availability: FallbackAvailability;
};

export type SelectionStrategy = {
  cliId: string;
  executionClass: string;
  fallbackChain: SelectionFallback[];
};

export type AgentProfileDraft = {
  profileId: string;
  name: string;
  selectionStrategy: SelectionStrategy;
  mcpIds: string[];
  skillIds: string[];
  ruleIds: string[];
};

export type MCPResourceSummary = {
  id: string;
  name: string;
  transport: MCPTransport;
  summary: string;
};

export type MCPResourceDraft = {
  id: string;
  name: string;
  transport: MCPTransport;
  command: string;
  args: string;
  env: string;
  endpoint: string;
  headers: string;
};

export type TextResourceSummary = {
  id: string;
  name: string;
  description: string;
};

export type TextResourceDraft = {
  id: string;
  name: string;
  description: string;
  content: string;
};

export type FallbackModelOption = {
  id: string;
  modelId: string;
  availability: FallbackAvailability;
};

export type FallbackSurfaceOption = {
  id: string;
  providerId: string;
  endpoint?: ProviderEndpoint;
  label: string;
  providerType: ProviderType;
  availability: FallbackAvailability;
  models: FallbackModelOption[];
};

export type FallbackProviderOption = {
  id: string;
  productId: string;
  label: string;
  iconUrl: string;
  productLabel: string;
  surfaces: FallbackSurfaceOption[];
};

import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import { providerAuthenticationLabel } from "./provider-authentication-presentation";
import { providerEndpointKind, providerEndpointProtocol } from "./provider-endpoint-presentation";
import { providerStatusReason } from "./provider-status-view";
import { providerProtocolLabel } from "./provider-protocol-presentation-store";
import type { ProviderProtocolValue } from "./provider-protocol";

type ProviderStatusColor = "green" | "red" | "amber" | "gray";

type ProviderAuthenticationKind = "cliOAuth" | "apiKey";

export type ProviderStatusView = {
  color: ProviderStatusColor;
  label: string;
  reason: string;
};

export interface ProviderModel {
  readonly raw: ProviderView;
  authenticationKind(): ProviderAuthenticationKind;
  authenticationLabel(): string;
  displayName(): string;
  protocolLabels(): string[];
  modelCount(): number;
  modelsSummary(): string;
  operationalSummary(): string;
  primaryEndpoint(): ProviderEndpoint | undefined;
  primarySurfaceId(): string;


  status(): ProviderStatusView;
}

class DefaultProviderModel implements ProviderModel {
  readonly raw: ProviderView;

  constructor(provider: ProviderView) {
    this.raw = provider;
  }

  authenticationKind() {
    return this.primaryEndpointKind() === ProviderEndpointType.CLI ? "cliOAuth" : "apiKey";
  }

  authenticationLabel() {
    const endpoint = this.primaryEndpoint();
    if (!endpoint) {
      return "Unknown Auth";
    }
    return providerAuthenticationLabel(providerEndpointKind(endpoint));
  }

  displayName() {
    const displayName = this.raw.displayName?.trim() || "";
    return displayName || this.raw.providerId;
  }

  protocolLabels() {
    const protocols = new Set(
      (this.raw.endpoints ?? [])
        .map((endpoint) => providerEndpointProtocol(endpoint))
        .filter((protocol): protocol is ProviderProtocolValue => Boolean(protocol)),
    );
    return [...protocols].map((protocol) => providerProtocolLabel(protocol)).filter(Boolean);
  }

  modelCount() {
    return this.raw.models?.length ?? 0;
  }

  modelsSummary() {
    const modelCount = this.modelCount();
    if (modelCount === 0) {
      return "No models configured";
    }
    return `${modelCount} model${modelCount === 1 ? "" : "s"}`;
  }

  operationalSummary() {
    return this.modelsSummary();
  }

  primaryEndpoint() {
    if ((this.raw.endpoints ?? []).length === 0) {
      return undefined;
    }
    return this.raw.endpoints[0];
  }

  primarySurfaceId() {
    return this.raw.surfaceId || "";
  }

  private primaryEndpointKind() {
    return providerEndpointKind(this.primaryEndpoint());
  }


  status(): ProviderStatusView {
    const phase = this.raw.status?.phase;
    if (phase === ProviderPhase.INVALID_CONFIG || phase === ProviderPhase.ERROR) {
      return { color: "red", label: "Needs Attention", reason: this.statusReason() };
    }
    if (phase === ProviderPhase.REFRESHING) {
      return { color: "amber", label: "Refreshing", reason: this.statusReason() };
    }
    if (phase === ProviderPhase.STALE) {
      return { color: "amber", label: "Stale", reason: this.statusReason() };
    }
    if (phase === ProviderPhase.READY) {
      return { color: "green", label: "Ready", reason: this.statusReason() };
    }
    return { color: "gray", label: "Unknown", reason: this.statusReason() };
  }

  private statusReason() {
    return providerStatusReason(this.raw.status?.phase, this.raw.status?.reason);
  }
}

export function providerModel(provider: ProviderView): ProviderModel {
  return new DefaultProviderModel(provider);
}

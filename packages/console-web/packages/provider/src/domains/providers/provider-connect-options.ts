import { OAuthAuthorizationFlow } from "@code-code/agent-contract/credential/v1";
import type { CLI, OAuthCallbackDelivery, Surface } from "@code-code/agent-contract/platform/support/v1";
import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import { providerConnectOptionAuthenticationLabel } from "./provider-authentication-presentation";
import { resolveProductInfo } from "./provider-product-info";
import { ProviderProtocol, type ProviderProtocolValue } from "./provider-protocol";
import { surfaceBaseURLTemplateParameters } from "./provider-surface-template";
import { apiEndpointsForSurface, cliIdForSurface } from "./provider-support-surface";

export const CUSTOM_API_KEY_SURFACE_ID = "custom.api";

export type ProviderConnectSurfaceOption = {
  baseUrl: string;
  parameterKeys?: string[];
  protocol: ProviderProtocolValue;
  surfaceId: string;
};

export type ProviderConnectOption =
  | {
    id: string;
    kind: "surfaceApiKey";
    displayName: string;
    prefilledSurfaces: ProviderConnectSurfaceOption[];
    iconUrl?: string;
  }
  | {
    id: string;
    kind: "customApiKey";
    displayName: string;
    surfaceId: string;
  }
  | {
    id: string;
    kind: "cliOAuth";
    displayName: string;
    cliId: string;
    surfaceId: string;
    flow: OAuthAuthorizationFlow;
    callbackDelivery?: OAuthCallbackDelivery;
    recommended: boolean;
  };

export type ProviderConnectOptionKind = ProviderConnectOption["kind"];

export function listProviderConnectOptions(
  productInfos: ProductInfo[],
  surfaces: Surface[],
  clis: CLI[]
): ProviderConnectOption[] {
  const surfaceOptions: ProviderConnectOption[] = surfaces
    .flatMap((surface): ProviderConnectOption[] => {
      const prefilledSurface = surfacePrefilledOption(surface);
      if (!prefilledSurface) {
        return [];
      }
      const resolvedProductInfo = resolveProductInfo(surface.productInfoId || surface.surfaceId, productInfos);
      return [{
        id: `surface:${surface.surfaceId}`,
        kind: "surfaceApiKey" as const,
        displayName: resolvedProductInfo?.displayName || surface.surfaceId,
        prefilledSurfaces: [prefilledSurface],
        ...(resolvedProductInfo?.iconUrl ? { iconUrl: resolvedProductInfo.iconUrl } : {}),
      }];
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  const cliOptions: ProviderConnectOption[] = clis
    .flatMap((item): ProviderConnectOption[] => {
      if (!item.oauth) {
        return [];
      }
      const surfaceId = cliSurfaceID(surfaces, item);
      if (!surfaceId) {
        return [];
      }
      return [{
        id: `cli:${item.cliId}`,
        kind: "cliOAuth" as const,
        displayName: item.displayName || item.cliId,
        cliId: item.cliId,
        surfaceId,
        flow: item.oauth?.flow || OAuthAuthorizationFlow.UNSPECIFIED,
        callbackDelivery: item.oauth?.codeFlow?.callbackDelivery,
        recommended: item.oauth?.recommended === true
      }];
    })
    .sort((left, right) => {
      if (left.kind !== "cliOAuth" || right.kind !== "cliOAuth") {
        return 0;
      }
      if (left.recommended !== right.recommended) {
        return left.recommended ? -1 : 1;
      }
      return left.displayName.localeCompare(right.displayName);
    });

  return [
    ...surfaceOptions,
    {
      id: "custom-api-key",
      kind: "customApiKey" as const,
      displayName: "Custom API Key",
      surfaceId: CUSTOM_API_KEY_SURFACE_ID,
    },
    ...cliOptions
  ];
}

function surfacePrefilledOption(surface: Surface): ProviderConnectSurfaceOption | undefined {
  const surfaceId = surface.surfaceId.trim();
  const endpoint = apiEndpointsForSurface(surface)[0];
  if (!surfaceId || !endpoint) {
    return undefined;
  }
  return {
    surfaceId,
    baseUrl: endpoint.baseUrl.trim(),
    parameterKeys: surfaceBaseURLTemplateParameters(endpoint.baseUrl),
    protocol: endpoint.protocol,
  };
}

function cliSurfaceID(surfaces: Surface[], cli: CLI) {
  const normalizedCLIID = cli.cliId.trim();
  if (!normalizedCLIID) {
    return "";
  }
  return surfaces.find((surface) => cliIdForSurface([surface], surface.surfaceId) === normalizedCLIID)?.surfaceId || "";
}

export function findProviderConnectOption(options: ProviderConnectOption[], optionId: string) {
  return options.find((item) => item.id === optionId);
}

export function isAPIKeyConnectOption(option?: ProviderConnectOption): option is Extract<ProviderConnectOption, { kind: "surfaceApiKey" | "customApiKey" }> {
  return option?.kind === "surfaceApiKey" || option?.kind === "customApiKey";
}

export function isSurfaceAPIKeyConnectOption(option?: ProviderConnectOption): option is Extract<ProviderConnectOption, { kind: "surfaceApiKey" }> {
  return option?.kind === "surfaceApiKey";
}

export function isCustomAPIKeyConnectOption(option?: ProviderConnectOption): option is Extract<ProviderConnectOption, { kind: "customApiKey" }> {
  return option?.kind === "customApiKey";
}

export function isCLIOAuthConnectOption(option?: ProviderConnectOption): option is Extract<ProviderConnectOption, { kind: "cliOAuth" }> {
  return option?.kind === "cliOAuth";
}

export function scopedProviderConnectOptionLabel(option: ProviderConnectOption) {
  if (isSurfaceAPIKeyConnectOption(option) || isCustomAPIKeyConnectOption(option)) {
    return option.displayName;
  }
  const authLabel = providerConnectOptionAuthenticationLabel(option.kind);
  const flowLabel = option.flow === OAuthAuthorizationFlow.DEVICE ? "Device Flow" : "Code Flow";
  return option.recommended
    ? `${option.displayName} · ${authLabel} · Recommended`
    : `${option.displayName} · ${authLabel} · ${flowLabel}`;
}

export function parseProtocolValue(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return ProviderProtocol.UNSPECIFIED;
  }
  return parsed as ProviderProtocolValue;
}

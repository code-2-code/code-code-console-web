import { type ProviderView } from "@code-code/agent-contract/platform/management/v1";
import {
  connectProviderWithCustomAPIKey,
  connectProviderWithOAuth,
  connectProviderWithSurfaceAPIKey,
} from "./api";
import {
  isCLIOAuthConnectOption,
  isCustomAPIKeyConnectOption,
  isSurfaceAPIKeyConnectOption,
  parseProtocolValue,
  type ProviderConnectOption,
} from "./provider-connect-options";
import { type ProviderConnectFormValues } from "./provider-connect-form-model";
import { hasSurfaceBaseURLTemplate, resolveSurfaceBaseURLTemplate } from "./provider-surface-template";
export async function startProviderOAuthConnect(
  selectedOption: ProviderConnectOption | undefined,
  data: ProviderConnectFormValues,
) {
  if (!selectedOption || !isCLIOAuthConnectOption(selectedOption)) {
    throw new Error("Unsupported provider connect option.");
  }
  const response = await connectProviderWithOAuth({
    surfaceId: selectedOption.surfaceId,
    displayName: data.displayName,
  });
  if (response.outcome.case !== "session") {
    throw new Error("Provider connect did not return a session.");
  }
  return {
    session: response.outcome.value,
    optionKind: selectedOption.kind,
    flow: selectedOption.flow,
  };
}

export async function confirmProviderAPIKeyConnect(
  selectedOption: ProviderConnectOption | undefined,
  data: ProviderConnectFormValues,
): Promise<ProviderView | undefined> {
  if (!selectedOption) {
    return undefined;
  }
  if (!isSurfaceAPIKeyConnectOption(selectedOption) && !isCustomAPIKeyConnectOption(selectedOption)) {
    throw new Error("Unsupported provider connect option.");
  }
  const response = isSurfaceAPIKeyConnectOption(selectedOption)
    ? await connectProviderWithSurfaceAPIKey({
      surfaceId: selectedOption.prefilledSurfaces[0]?.surfaceId || "",
      displayName: data.displayName,
      apiKey: data.apiKey,
      baseUrl: resolveSurfaceAPIKeyBaseURL(selectedOption, data),
    })
    : await connectProviderWithCustomAPIKey({
      surfaceId: selectedOption.surfaceId,
      displayName: data.displayName,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl,
      protocol: parseProtocolValue(data.protocol),
    });
  return response.outcome.case === "provider" ? response.outcome.value : undefined;
}

function resolveSurfaceAPIKeyBaseURL(selectedOption: Extract<ProviderConnectOption, { kind: "surfaceApiKey" }>, data: ProviderConnectFormValues) {
  const template = selectedOption.prefilledSurfaces[0]?.baseUrl || "";
  if (!hasSurfaceBaseURLTemplate(template)) {
    return undefined;
  }
  return resolveSurfaceBaseURLTemplate(template, data.surfaceParameters || {});
}

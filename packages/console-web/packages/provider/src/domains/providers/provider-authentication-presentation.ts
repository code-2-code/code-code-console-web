import { ProviderEndpointType } from "@code-code/agent-contract/provider/v1";

export function providerAuthenticationLabel(kind: ProviderEndpointType | undefined) {
  switch (kind) {
    case ProviderEndpointType.CLI:
      return "CLI OAuth";
    case ProviderEndpointType.API:
      return "API Key";
    default:
      return "Unknown Auth";
  }
}

export function providerConnectOptionAuthenticationLabel(kind: "surfaceApiKey" | "customApiKey" | "cliOAuth") {
  return kind === "cliOAuth" ? "CLI OAuth" : "API Key";
}

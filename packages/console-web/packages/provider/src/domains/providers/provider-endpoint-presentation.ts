import {
  ProviderEndpointType,
  type ProviderEndpoint,
} from "@code-code/agent-contract/provider/v1";
import type { ProviderProtocolValue } from "./provider-protocol";

export function providerEndpointKind(endpoint?: ProviderEndpoint) {
  switch (endpoint?.shape.case) {
    case "api":
      return ProviderEndpointType.API;
    case "cli":
      return ProviderEndpointType.CLI;
    default:
      return ProviderEndpointType.UNSPECIFIED;
  }
}

export function providerEndpointCLIID(endpoint?: ProviderEndpoint) {
  return endpoint?.shape.case === "cli" ? endpoint.shape.value.cliId.trim() : "";
}

export function providerEndpointProtocol(endpoint?: ProviderEndpoint): ProviderProtocolValue | undefined {
  return endpoint?.shape.case === "api" ? endpoint.shape.value.protocol : undefined;
}

export function providerEndpointBaseURL(endpoint?: ProviderEndpoint) {
  return endpoint?.shape.case === "api" ? endpoint.shape.value.baseUrl.trim() : "";
}


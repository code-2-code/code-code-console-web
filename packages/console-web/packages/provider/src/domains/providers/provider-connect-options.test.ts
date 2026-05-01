import { describe, expect, it } from "vitest";
import { OAuthAuthorizationFlow } from "@code-code/agent-contract/credential/v1";
import type { CLI, Surface } from "@code-code/agent-contract/platform/support/v1";
import { listProviderConnectOptions } from "./provider-connect-options";

describe("provider connect options", () => {
  it("resolves cli oauth option surface by explicit cli surface mapping", () => {
    const surfaces = [cliSurface("codex", "codex-surface")];
    const clis = [
      oauthCLI("codex", "Codex CLI"),
    ];

    const options = listProviderConnectOptions([], surfaces, clis);
    const codexOption = options.find((item) => item.id === "cli:codex");

    expect(codexOption?.kind).toBe("cliOAuth");
    expect(codexOption && "surfaceId" in codexOption ? codexOption.surfaceId : "").toBe("codex-surface");
  });

  it("does not generate cli oauth option when no cli surface mapping exists", () => {
    const clis = [oauthCLI("codex", "Codex CLI")];

    const options = listProviderConnectOptions([], [], clis);
    const codexOption = options.find((item) => item.id === "cli:codex");

    expect(codexOption).toBeUndefined();
  });
});

function cliSurface(cliId: string, surfaceId: string): Surface {
  return {
    surfaceId,
    spec: {
      case: "cli",
      value: {
        cliId,
      },
    },
  } as unknown as Surface;
}

function oauthCLI(cliId: string, displayName: string): CLI {
  return {
    cliId,
    displayName,
    oauth: {
      flow: OAuthAuthorizationFlow.CODE,
      recommended: true,
    },
  } as unknown as CLI;
}

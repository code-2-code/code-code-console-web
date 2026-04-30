import { describe, expect, it } from "vitest";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import { providerStatusReason } from "./provider-status-view";

describe("provider-status-view", () => {
  it("hides ready reason", () => {
    expect(
      providerStatusReason(
        ProviderPhase.READY,
        "Provider surface configuration is valid.",
      ),
    ).toBe("");
  });

  it("preserves non-ready reason", () => {
    expect(
      providerStatusReason(
        ProviderPhase.INVALID_CONFIG,
        "credential material missing",
      ),
    ).toBe("credential material missing");
  });
});

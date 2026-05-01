import { create } from "@bufbuild/protobuf";
import { ProviderModelSchema } from "@code-code/agent-contract/provider/v1";
import { describe, expect, it } from "vitest";
import { describeProviderModel } from "./provider-model-presentation";

describe("provider-model-presentation", () => {
  it("prefers canonical model id for labels when model ref differs", () => {
    const presentation = describeProviderModel(create(ProviderModelSchema, {
      providerModelId: "chat_20706",
      modelRef: {
        vendorId: "google",
        modelId: "gemini-2.5-pro",
      },
    }));

    expect(presentation.label).toBe("gemini-2.5-pro");
    expect(presentation.detail).toBe("Provider ID: chat_20706");
  });
});

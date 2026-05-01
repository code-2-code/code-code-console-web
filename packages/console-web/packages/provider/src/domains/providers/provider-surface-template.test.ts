import { describe, expect, it } from "vitest";
import {
  defaultSurfaceTemplateValues,
  hasSurfaceBaseURLTemplate,
  resolveSurfaceBaseURLTemplate,
  surfaceBaseURLTemplateParameters,
} from "./provider-surface-template";

describe("provider surface template", () => {
  it("extracts template parameters", () => {
    expect(surfaceBaseURLTemplateParameters("https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1")).toEqual(["account_id"]);
    expect(surfaceBaseURLTemplateParameters("https://api.example.com/v1")).toEqual([]);
  });

  it("resolves template values", () => {
    expect(resolveSurfaceBaseURLTemplate(
      "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1",
      { account_id: "04d289f3ff972711c415793f0b7da61d" },
    )).toBe("https://api.cloudflare.com/client/v4/accounts/04d289f3ff972711c415793f0b7da61d/ai/v1");
  });

  it("builds default values", () => {
    expect(defaultSurfaceTemplateValues("https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1")).toEqual({
      account_id: "",
    });
    expect(defaultSurfaceTemplateValues("https://api.example.com/v1")).toEqual({});
  });

  it("detects template usage", () => {
    expect(hasSurfaceBaseURLTemplate("https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1")).toBe(true);
    expect(hasSurfaceBaseURLTemplate("https://api.example.com/v1")).toBe(false);
  });
});

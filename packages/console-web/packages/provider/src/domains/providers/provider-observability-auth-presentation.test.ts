import {
  QuotaQueryInputControl,
  QuotaQueryInputPersistence,
  QuotaQueryInputValueTransform,
} from "@code-code/agent-contract/observability/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { describe, expect, it } from "vitest";
import { providerObservabilityAuthPresentation } from "./provider-observability-auth-presentation";

describe("provider observability auth presentation", () => {
  it("derives the form from vendor support metadata", () => {
    const presentation = providerObservabilityAuthPresentation("mistral", [vendorWithForm()], "openai-compatible");

    expect(presentation?.schemaId).toBe("mistral-admin-billing-session");
    expect(presentation?.fieldLabel).toBe("Request Cookie");
    expect(presentation?.providerActionLabel).toBe("Update Admin Session");
    expect(presentation?.requiredKeys).toEqual(["cookie"]);
    expect(presentation?.fields[0]).toMatchObject({
      key: "cookie",
      sensitive: true,
      persistence: QuotaQueryInputPersistence.STORED_MATERIAL,
    });
    expect(presentation?.fields).toHaveLength(1);
  });

  it("returns null when support metadata does not declare an input form", () => {
    expect(providerObservabilityAuthPresentation("minimax", [])).toBeNull();
  });
});

function vendorWithForm(): Vendor {
  return {
    $typeName: "platform.support.v1.Vendor",
    vendor: {
      $typeName: "vendor_definition.v1.Vendor",
      vendorId: "mistral",
      displayName: "Mistral",
      aliases: [],
      iconUrl: "",
      websiteUrl: "",
      description: "",
    },
    surfaces: [{
      $typeName: "platform.support.v1.Surface",
      surfaceId: "openai-compatible",
      productInfoId: "mistral",
      spec: {
        case: "api",
        value: {
          $typeName: "platform.support.v1.ApiSurface",
          apiEndpoints: [],
        },
      },
      observability: {
        $typeName: "observability.v1.ObservabilityCapability",
        profiles: [{
          $typeName: "observability.v1.ObservabilityProfile",
          profileId: "billing",
          displayName: "Billing",
          scopeIds: [],
          metrics: [],
          metricQueries: [],
          collection: {
            case: "quotaQuery",
            value: {
              $typeName: "observability.v1.QuotaQueryCollection",
              collectorId: "mistral-billing",
              dynamicParameters: [],
              credentialBackfills: [],
              inputForm: {
                $typeName: "observability.v1.QuotaQueryInputForm",
                schemaId: "mistral-admin-billing-session",
                title: "Update Mistral Admin Session",
                actionLabel: "Update Admin Session",
                description: "Paste the Mistral Admin browser Cookie request header.",
                fields: [
                  {
                    $typeName: "observability.v1.QuotaQueryInputField",
                    fieldId: "cookie",
                    label: "Request Cookie",
                    description: "",
                    placeholder: "ory_session_...=...; csrftoken=...",
                    required: true,
                    sensitive: true,
                    control: QuotaQueryInputControl.TEXTAREA,
                    persistence: QuotaQueryInputPersistence.STORED_MATERIAL,
                    targetFieldId: "",
                    transform: QuotaQueryInputValueTransform.IDENTITY,
                    defaultValue: "",
                  },
                ],
              },
            },
          },
        }],
      },
    }],
  };
}

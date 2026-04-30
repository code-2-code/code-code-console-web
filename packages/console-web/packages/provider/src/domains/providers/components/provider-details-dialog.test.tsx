import { create } from "@bufbuild/protobuf";
import { Theme } from "@radix-ui/themes";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ActiveQueryInputControl,
  ActiveQueryInputPersistence,
  ActiveQueryInputValueTransform,
} from "@code-code/agent-contract/observability/v1";
import {
  ProviderViewSchema,
  type ProviderView,
} from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { ProviderProtocol } from "../provider-protocol";
import { ProviderDetailsDialog } from "./provider-details-dialog";

describe("ProviderDetailsDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows vendor session auth action from support metadata", () => {
    render(
      <Theme>
        <ProviderDetailsDialog
          provider={mistralProvider()}
          clis={[]}
          vendors={[mistralVendor()]}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          onProbeActiveQuery={vi.fn()}
        />
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update Session Token" }));

    expect(screen.getByRole("heading", { name: "Update Mistral Session Token" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste Mistral session token")).toHaveAttribute("name", "values.access_token");
  });

  it("shows vendor observability multi-field form from support metadata", () => {
    render(
      <Theme>
        <ProviderDetailsDialog
          provider={googleProvider()}
          clis={[]}
          vendors={[googleVendor()]}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          onProbeActiveQuery={vi.fn()}
        />
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update AI Studio Session" }));

    expect(screen.getByRole("heading", { name: "Update AI Studio Session" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SID=\.\.\.; HSID=/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AIzaSy...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("946397203396 or projects/946397203396")).toBeInTheDocument();
  });
});

function mistralProvider(): ProviderView {
  return create(ProviderViewSchema, {
    providerId: "mistral-ai",
    displayName: "Mistral AI",
    providerCredentialId: "mistral-api-key",
    productInfoId: "mistral",
    surfaceId: "openai-compatible",
    runtime: {
      displayName: "Mistral OpenAI Compatible",
      access: {
        case: "api",
        value: {
          protocol: ProviderProtocol.OPENAI_COMPATIBLE,
          baseUrl: "https://api.mistral.ai/v1",
        },
      },
    },
    status: {
      phase: ProviderPhase.READY,
    },
  });
}

function mistralVendor(): Vendor {
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
    providerBindings: [{
      $typeName: "platform.support.v1.VendorProviderBinding",
      providerBinding: {
        $typeName: "platform.management.v1.ProviderView",
        surfaceId: "openai-compatible",
        modelCatalogProbeId: "",
        quotaProbeId: "",
        egressPolicyId: "",
        headerRewritePolicyId: "",
      },
      surfaceTemplates: [],
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
            case: "activeQuery",
            value: {
              $typeName: "observability.v1.ActiveQueryCollection",
              collectorId: "mistral-billing",
              dynamicParameters: [],
              credentialBackfills: [],
              inputForm: {
                $typeName: "observability.v1.ActiveQueryInputForm",
                schemaId: "mistral-billing-session",
                title: "Update Mistral Session Token",
                actionLabel: "Update Session Token",
                description: "Paste the session token.",
                fields: [{
                  $typeName: "observability.v1.ActiveQueryInputField",
                  fieldId: "access_token",
                  label: "Session token",
                  description: "",
                  placeholder: "Paste Mistral session token",
                  required: true,
                  sensitive: true,
                  control: ActiveQueryInputControl.PASSWORD,
    persistence: ActiveQueryInputPersistence.STORED_MATERIAL,
                  targetFieldId: "",
                  transform: ActiveQueryInputValueTransform.IDENTITY,
                  defaultValue: "",
                }],
              },
            },
          },
        }],
      },
    }],
  };
}

function googleProvider(): ProviderView {
  return create(ProviderViewSchema, {
    providerId: "google",
    displayName: "Google",
    providerCredentialId: "google-api-key",
    productInfoId: "google",
    surfaceId: "gemini",
    runtime: {
      displayName: "Google Gemini",
      access: {
        case: "api",
        value: {
          protocol: ProviderProtocol.GEMINI,
          baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        },
      },
    },
    status: {
      phase: ProviderPhase.READY,
    },
  });
}

function googleVendor(): Vendor {
  return {
    $typeName: "platform.support.v1.Vendor",
    vendor: {
      $typeName: "vendor_definition.v1.Vendor",
      vendorId: "google",
      displayName: "Google",
      aliases: [],
      iconUrl: "",
      websiteUrl: "",
      description: "",
    },
    providerBindings: [{
      $typeName: "platform.support.v1.VendorProviderBinding",
      providerBinding: {
        $typeName: "platform.management.v1.ProviderView",
        surfaceId: "gemini",
        modelCatalogProbeId: "",
        quotaProbeId: "",
        egressPolicyId: "",
        headerRewritePolicyId: "",
      },
      surfaceTemplates: [],
      observability: {
        $typeName: "observability.v1.ObservabilityCapability",
        profiles: [{
          $typeName: "observability.v1.ObservabilityProfile",
          profileId: "aistudio-quota",
          displayName: "AI Studio Quota",
          scopeIds: [],
          metrics: [],
          metricQueries: [],
          collection: {
            case: "activeQuery",
            value: {
              $typeName: "observability.v1.ActiveQueryCollection",
              collectorId: "google-aistudio-quotas",
              dynamicParameters: [],
              credentialBackfills: [],
              inputForm: {
                $typeName: "observability.v1.ActiveQueryInputForm",
                schemaId: "google-ai-studio-session",
                title: "Update AI Studio Session",
                actionLabel: "Update AI Studio Session",
                description: "Paste AI Studio browser session fields and the quota project number.",
                fields: [
                  {
                    $typeName: "observability.v1.ActiveQueryInputField",
                    fieldId: "cookie",
                    label: "Request Cookie",
                    description: "Copy the Cookie request header.",
                    placeholder: "SID=...; HSID=...; SSID=...; SAPISID=...; __Secure-1PAPISID=...",
                    required: true,
                    sensitive: true,
                    control: ActiveQueryInputControl.TEXTAREA,
                    persistence: ActiveQueryInputPersistence.STORED_MATERIAL,
                    targetFieldId: "",
                    transform: ActiveQueryInputValueTransform.IDENTITY,
                    defaultValue: "",
                  },
                  {
                    $typeName: "observability.v1.ActiveQueryInputField",
                    fieldId: "page_api_key",
                    label: "X-Goog-Api-Key",
                    description: "",
                    placeholder: "AIzaSy...",
                    required: true,
                    sensitive: true,
                    control: ActiveQueryInputControl.PASSWORD,
                    persistence: ActiveQueryInputPersistence.STORED_MATERIAL,
                    targetFieldId: "",
                    transform: ActiveQueryInputValueTransform.IDENTITY,
                    defaultValue: "",
                  },
                  {
                    $typeName: "observability.v1.ActiveQueryInputField",
                    fieldId: "project_id",
                    label: "Project number",
                    description: "Use the projects/<number> value.",
                    placeholder: "946397203396 or projects/946397203396",
                    required: true,
                    sensitive: false,
                    control: ActiveQueryInputControl.TEXT,
                    persistence: ActiveQueryInputPersistence.STORED_MATERIAL,
                    targetFieldId: "",
                    transform: ActiveQueryInputValueTransform.IDENTITY,
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

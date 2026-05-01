import { create } from "@bufbuild/protobuf";
import { Theme } from "@radix-ui/themes";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  QuotaQueryInputControl,
  QuotaQueryInputPersistence,
  QuotaQueryInputValueTransform,
} from "@code-code/agent-contract/observability/v1";
import {
  ProviderViewSchema,
  type ProviderView,
} from "@code-code/agent-contract/platform/management/v1";
import { ProviderEndpointType, type ProviderEndpoint } from "@code-code/agent-contract/provider/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { ProviderProtocol, type ProviderProtocolValue } from "../provider-protocol";
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
          surfaces={[]}
          vendors={[mistralVendor()]}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          onProbeModelCatalog={vi.fn()}
          onProbeQuotaQuery={vi.fn()}
        />
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update Admin Session" }));

    expect(screen.getByRole("heading", { name: "Update Mistral Admin Session" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ory_session_...=...; csrftoken=...")).toBeInTheDocument();
  });

  it("shows vendor observability multi-field form from support metadata", () => {
    render(
      <Theme>
        <ProviderDetailsDialog
          provider={googleProvider()}
          clis={[]}
          surfaces={[]}
          vendors={[googleVendor()]}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          onProbeModelCatalog={vi.fn()}
          onProbeQuotaQuery={vi.fn()}
        />
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update AI Studio Session" }));

    expect(screen.getByRole("heading", { name: "Update AI Studio Session" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SID=\.\.\.; HSID=/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("946397203396 or projects/946397203396")).toBeInTheDocument();
  });
});

function mistralProvider(): ProviderView {
  return create(ProviderViewSchema, {
    providerId: "mistral-ai",
    displayName: "Mistral AI",
    providerCredentialId: "mistral-api-key",
    surfaceId: "openai-compatible",
    endpoints: [apiEndpoint(ProviderProtocol.OPENAI_COMPATIBLE, "https://api.mistral.ai/v1")],
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
    surfaces: [{
      $typeName: "platform.support.v1.Surface",
      surfaceId: "openai-compatible",
      productInfoId: "mistral",
      spec: { case: "api", value: { $typeName: "platform.support.v1.ApiSurface", apiEndpoints: [] } },
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
                fields: [{
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
    surfaceId: "gemini",
    endpoints: [apiEndpoint(ProviderProtocol.GEMINI, "https://generativelanguage.googleapis.com/v1beta")],
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
    surfaces: [{
      $typeName: "platform.support.v1.Surface",
      surfaceId: "gemini",
      productInfoId: "google",
      spec: { case: "api", value: { $typeName: "platform.support.v1.ApiSurface", apiEndpoints: [] } },
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
            case: "quotaQuery",
            value: {
              $typeName: "observability.v1.QuotaQueryCollection",
              collectorId: "google-aistudio-quotas",
              dynamicParameters: [],
              credentialBackfills: [],
              inputForm: {
                $typeName: "observability.v1.QuotaQueryInputForm",
                schemaId: "google-ai-studio-session",
                title: "Update AI Studio Session",
                actionLabel: "Update AI Studio Session",
                description: "Paste AI Studio browser session fields and the quota project number.",
                fields: [
                  {
                    $typeName: "observability.v1.QuotaQueryInputField",
                    fieldId: "cookie",
                    label: "Request Cookie",
                    description: "Copy the Cookie request header.",
                    placeholder: "SID=...; HSID=...; SSID=...; SAPISID=...; __Secure-1PAPISID=...",
                    required: true,
                    sensitive: true,
                    control: QuotaQueryInputControl.TEXTAREA,
                    persistence: QuotaQueryInputPersistence.STORED_MATERIAL,
                    targetFieldId: "",
                    transform: QuotaQueryInputValueTransform.IDENTITY,
                    defaultValue: "",
                  },
                  {
                    $typeName: "observability.v1.QuotaQueryInputField",
                    fieldId: "project_id",
                    label: "Project number",
                    description: "Use the projects/<number> value.",
                    placeholder: "946397203396 or projects/946397203396",
                    required: true,
                    sensitive: false,
                    control: QuotaQueryInputControl.TEXT,
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

function apiEndpoint(protocol: ProviderProtocolValue, baseUrl: string): ProviderEndpoint {
  return {
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: { protocol, baseUrl },
    },
  } as ProviderEndpoint;
}

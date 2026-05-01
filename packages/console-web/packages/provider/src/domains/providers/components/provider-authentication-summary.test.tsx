import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderAuthenticationSummary } from "./provider-authentication-summary";

const mocks = vi.hoisted(() => ({
  useProviderAuthenticationSummary: vi.fn(),
}));

vi.mock("../api", () => ({
  useProviderAuthenticationSummary: mocks.useProviderAuthenticationSummary,
}));

describe("ProviderAuthenticationSummary", () => {
  afterEach(() => {
    mocks.useProviderAuthenticationSummary.mockReset();
    cleanup();
  });

  it("shows API key authentication storage details", () => {
    mocks.useProviderAuthenticationSummary.mockReturnValue({ summary: undefined, error: undefined });
    render(<ProviderAuthenticationSummary providerId="provider-1" providerCredentialId="cred-1" kind="apiKey" />);

    expect(screen.getByText("cred-1")).toBeInTheDocument();
    expect(screen.getByText("API key")).toBeInTheDocument();
    expect(screen.getByText("Managed by auth service")).toBeInTheDocument();
  });

  it("shows CLI OAuth authentication storage details", () => {
    mocks.useProviderAuthenticationSummary.mockReturnValue({ summary: undefined, error: undefined });
    render(<ProviderAuthenticationSummary providerId="provider-2" providerCredentialId="cred-2" kind="cliOAuth" />);

    expect(screen.getByText("cred-2")).toBeInTheDocument();
    expect(screen.getByText("CLI OAuth")).toBeInTheDocument();
    expect(screen.getByText("Managed by auth service")).toBeInTheDocument();
  });

  it("shows observability credential project summary", () => {
    mocks.useProviderAuthenticationSummary.mockReturnValue({
      summary: {
        observability: {
          credentialId: "provider-google-observability",
          fields: [{ fieldId: "project_id", label: "Project ID", value: "projects/123" }],
        },
      },
      error: undefined,
    });

    render(<ProviderAuthenticationSummary providerId="provider-google" providerCredentialId="cred-3" kind="apiKey" />);

    expect(screen.getByText("Project ID")).toBeInTheDocument();
    expect(screen.getByText("projects/123")).toBeInTheDocument();
  });
});

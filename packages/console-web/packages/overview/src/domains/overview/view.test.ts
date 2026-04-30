import { describe, expect, it } from "vitest";
import { create } from "@bufbuild/protobuf";
import {
  CredentialStatusSchema,
  CredentialViewSchema,
  ProviderStatusSchema,
  ProviderViewSchema,
} from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";
import {
  collectOverviewIssues,
  summarizeCredentials,
  summarizeProviderAccounts,
} from "./view";

describe("overview view", () => {
  it("summarizes provider account readiness", () => {
    const summary = summarizeProviderAccounts([
      create(ProviderViewSchema, {
        providerId: "account-ready",
        displayName: "OpenAI",
        status: create(ProviderStatusSchema, {
          phase: ProviderPhase.READY,
        }),
      }),
      create(ProviderViewSchema, {
        providerId: "account-alert",
        displayName: "Anthropic",
        status: create(ProviderStatusSchema, {
          phase: ProviderPhase.INVALID_CONFIG,
          reason: "credential material is not ready",
        }),
      }),
      create(ProviderViewSchema, {
        providerId: "account-unknown",
        displayName: "Gemini",
      }),
    ]);

    expect(summary).toMatchObject({
      total: 3,
      ready: 1,
      attention: 1,
      unknown: 1,
    });
    expect(summary.issues).toMatchObject([{
      level: "red",
      title: "Provider · Anthropic",
      reason: "credential material is not ready",
      href: "/providers?account=account-alert",
      actionLabel: "Review Provider",
    }]);
  });

  it("summarizes credential readiness", () => {
    const summary = summarizeCredentials([
      create(CredentialViewSchema, {
        credentialId: "cred-ready",
        displayName: "Ready Key",
        status: create(CredentialStatusSchema, { materialReady: true }),
      }),
      create(CredentialViewSchema, {
        credentialId: "cred-alert",
        displayName: "Broken Key",
        status: create(CredentialStatusSchema, {
          materialReady: false,
          reason: "credential material missing",
        }),
      }),
      create(CredentialViewSchema, {
        credentialId: "cred-unknown",
        displayName: "Pending Key",
      }),
    ]);

    expect(summary).toMatchObject({
      total: 3,
      ready: 1,
      attention: 1,
      unknown: 1,
    });
    expect(summary.issues).toMatchObject([{
      level: "red",
      title: "Credential · Broken Key",
      reason: "credential material missing",
      href: "/providers?credential=cred-alert",
      actionLabel: "Review Authentication",
    }]);
  });

  it("sorts combined issues by severity then title", () => {
    const issues = collectOverviewIssues({
      total: 2,
      ready: 0,
      attention: 2,
      unknown: 0,
      issues: [
        { level: "amber", title: "Provider · Zeta", reason: "1/2 endpoints ready" },
        { level: "red", title: "Provider · Alpha", reason: "credential material missing" },
      ],
    });

    expect(issues.map((item) => item.title)).toEqual([
      "Provider · Alpha",
      "Provider · Zeta",
    ]);
  });
});



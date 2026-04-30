import type { CredentialView, ProviderView } from "@code-code/agent-contract/platform/management/v1";
import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";

type OverviewIssueLevel = "red" | "amber";

export type OverviewIssue = {
  level: OverviewIssueLevel;
  title: string;
  reason: string;
  href?: string;
  actionLabel?: string;
};

export type OverviewSummary = {
  total: number;
  ready: number;
  attention: number;
  unknown: number;
  issues: OverviewIssue[];
};

export function summarizeProviderAccounts(accounts: ProviderView[]): OverviewSummary {
  const summary: OverviewSummary = {
    total: accounts.length,
    ready: 0,
    attention: 0,
    unknown: 0,
    issues: [],
  };
  for (const account of accounts) {
    const phase = account.status?.phase;
    if (phase === ProviderPhase.INVALID_CONFIG || phase === ProviderPhase.ERROR) {
      summary.attention += 1;
      summary.issues.push({
        level: "red",
        title: `Provider · ${account.displayName || account.providerId}`,
        reason: account.status?.reason || "Provider endpoint is not fully ready.",
        href: `/providers?account=${encodeURIComponent(account.providerId)}`,
        actionLabel: "Review Provider",
      });
      continue;
    }
    if (phase === ProviderPhase.REFRESHING || phase === ProviderPhase.STALE) {
      summary.attention += 1;
      summary.issues.push({
        level: "amber",
        title: `Provider · ${account.displayName || account.providerId}`,
        reason: account.status?.reason || "Provider endpoint is not fully ready.",
        href: `/providers?account=${encodeURIComponent(account.providerId)}`,
        actionLabel: "Review Provider",
      });
      continue;
    }
    if (phase === ProviderPhase.READY) {
      summary.ready += 1;
      continue;
    }
    summary.unknown += 1;
  }
  return summary;
}

export function summarizeCredentials(credentials: CredentialView[]): OverviewSummary {
  const summary: OverviewSummary = {
    total: credentials.length,
    ready: 0,
    attention: 0,
    unknown: 0,
    issues: [],
  };
  for (const credential of credentials) {
    if (credential.status?.materialReady === true) {
      summary.ready += 1;
      continue
    }
    if (credential.status?.materialReady === false) {
      summary.attention += 1;
      summary.issues.push({
        level: "red",
        title: `Credential · ${credential.displayName || credential.credentialId}`,
        reason: credential.status.reason || "Authentication material is not ready.",
        href: `/providers?credential=${encodeURIComponent(credential.credentialId)}`,
        actionLabel: "Review Authentication",
      });
      continue
    }
    summary.unknown += 1;
  }
  return summary;
}

export function collectOverviewIssues(providerSummary: OverviewSummary): OverviewIssue[] {
  return [...providerSummary.issues].sort(compareIssues);
}

function compareIssues(left: OverviewIssue, right: OverviewIssue) {
  if (left.level !== right.level) {
    return left.level === "red" ? -1 : 1;
  }
  return left.title.localeCompare(right.title);
}

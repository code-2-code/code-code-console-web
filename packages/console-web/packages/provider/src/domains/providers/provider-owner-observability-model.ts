import type { ProviderObservability, ProviderOwnerObservabilityItem } from "./api";
import { formatObservedAtLocal, formatObservedAtRelative } from "./provider-observability-time";
import { normalizeProviderOwnerId } from "./provider-owner-id";

export type ProviderRuntimeMetricRow = {
  labels?: Record<string, string>;
  value?: number;
};

export type ProviderObservabilityOwner =
  | { kind: "cli"; cliId: string; surfaceId: string }
  | { kind: "vendor"; vendorId: string; surfaceId: string };

export interface ProviderOwnerObservabilityModel {
  readonly raw: ProviderOwnerObservabilityItem;
  metricRows(metricName: string, labels?: Record<string, string>): ProviderRuntimeMetricRow[];
  metricValue(metricName: string, labels?: Record<string, string>): number | null;
  lastProbeOutcomeValue(): number | null;
  lastProbeReason(): string | null;
  authUsableValue(): number | null;
  displayAuthUsableValue(): number | null;
  credentialLastUsedTimestamp(): string | null;
  credentialLastUsedRelativeLabel(now?: Date): string | null;
  observedAtTimestamp(): string | null;
  observedAtLabel(now?: Date, timeZone?: string): string | null;
  observedAtRelativeLabel(now?: Date): string | null;
}

class DefaultProviderOwnerObservabilityModel implements ProviderOwnerObservabilityModel {
  readonly raw: ProviderOwnerObservabilityItem;
  private readonly surfaceId: string;

  constructor(item: ProviderOwnerObservabilityItem, surfaceId: string) {
    this.raw = item;
    this.surfaceId = surfaceId.trim();
  }

  metricRows(metricName: string, labels: Record<string, string> = {}) {
    const rows = this.raw.runtimeMetrics?.find((entry) => entry.metricName === metricName)?.rows ?? [];
    const expectedLabels = normalizeMetricLabels(labels);
    if (Object.keys(expectedLabels).length === 0) {
      return rows;
    }
    return rows.filter((row) => metricLabelsMatch(row.labels, expectedLabels));
  }

  metricValue(metricName: string, labels: Record<string, string> = {}) {
    const rows = this.metricRows(metricName, labels);
    const value = rows[0]?.value;
    return typeof value === "number" ? value : null;
  }

  lastProbeOutcomeValue() {
    if (!this.surfaceId) {
      const value = this.raw.lastProbeOutcome?.[0]?.value;
      return typeof value === "number" ? value : null;
    }
    const value = this.raw.lastProbeOutcome?.find(
      (entry) => (entry.surfaceId || "").trim() === this.surfaceId,
    )?.value;
    if (typeof value !== "number") {
      const fallback = this.raw.lastProbeOutcome?.[0]?.value;
      return typeof fallback === "number" ? fallback : null;
    }
    return typeof value === "number" ? value : null;
  }

  lastProbeReason() {
    if (!this.surfaceId) {
      return this.raw.lastProbeReason?.[0]?.reason?.trim() || null;
    }
    const matched = this.raw.lastProbeReason?.find(
      (entry) => (entry.surfaceId || "").trim() === this.surfaceId,
    )?.reason?.trim();
    if (matched) {
      return matched;
    }
    return this.raw.lastProbeReason?.[0]?.reason?.trim() || null;
  }

  authUsableValue() {
    return this.readSurfaceValue(this.raw.authUsable);
  }

  displayAuthUsableValue() {
    switch (this.lastProbeOutcomeValue()) {
      case 1:
      case 3:
        return this.authUsableValue();
      default:
        return null;
    }
  }

  credentialLastUsedTimestamp() {
    return this.readSurfaceTimestamp(this.raw.credentialLastUsed) || null;
  }

  credentialLastUsedRelativeLabel(now: Date = new Date()) {
    return formatObservedAtRelative(this.readSurfaceTimestamp(this.raw.credentialLastUsed), now);
  }

  observedAtTimestamp() {
    const timestamp = this.readLastProbeRunTimestamp();
    return timestamp || null;
  }

  observedAtLabel(now: Date = new Date(), timeZone?: string) {
    const timestamp = this.readLastProbeRunTimestamp();
    return formatObservedAtLocal(timestamp, now, timeZone);
  }

  observedAtRelativeLabel(now: Date = new Date()) {
    const timestamp = this.readLastProbeRunTimestamp();
    return formatObservedAtRelative(timestamp, now);
  }

  private readLastProbeRunTimestamp() {
    return this.readSurfaceTimestamp(this.raw.lastProbeRun);
  }

  private readSurfaceValue(rows: Array<{ surfaceId?: string; value?: number }> | undefined) {
    if (!this.surfaceId) {
      const value = rows?.[0]?.value;
      return typeof value === "number" ? value : null;
    }
    const matched = rows?.find(
      (entry) => (entry.surfaceId || "").trim() === this.surfaceId,
    );
    const accountLevel = rows?.find((entry) => (entry.surfaceId || "").trim() === "");
    const value = matched?.value ?? accountLevel?.value;
    if (typeof value === "number") {
      return value;
    }
    return null;
  }

  private readSurfaceTimestamp(rows: Array<{ surfaceId?: string; timestamp?: string }> | undefined) {
    if (!this.surfaceId) {
      return rows?.[0]?.timestamp?.trim() || "";
    }
    const matched = rows?.find((entry) => (entry.surfaceId || "").trim() === this.surfaceId)?.timestamp?.trim() || "";
    if (matched) {
      return matched;
    }
    return rows?.find((entry) => (entry.surfaceId || "").trim() === "")?.timestamp?.trim() || "";
  }
}

export function providerOwnerObservabilityModel(
  item: ProviderOwnerObservabilityItem | undefined,
  surfaceId: string,
): ProviderOwnerObservabilityModel | null {
  if (!item) {
    return null;
  }
  return new DefaultProviderOwnerObservabilityModel(item, surfaceId);
}

export function resolveProviderOwnerObservabilityItem(
  detail: ProviderObservability | undefined,
  owner: ProviderObservabilityOwner,
) {
  switch (owner.kind) {
    case "cli": {
      const normalizedCLIID = normalizeProviderOwnerId(owner.cliId);
      if (!normalizedCLIID) {
        return undefined;
      }
      return detail?.items?.find((item) => normalizeProviderOwnerId(item.cliId || "") === normalizedCLIID);
    }
    case "vendor": {
      const normalizedVendorID = normalizeProviderOwnerId(owner.vendorId);
      if (!normalizedVendorID) {
        return undefined;
      }
      return detail?.items?.find(
        (item) => item.owner === "vendor" && normalizeProviderOwnerId(item.vendorId || "") === normalizedVendorID
      );
    }
  }
}

export function resolveProviderOwnerObservabilityModel(
  detail: ProviderObservability | undefined,
  owner: ProviderObservabilityOwner,
  surfaceId: string,
) {
  return providerOwnerObservabilityModel(resolveProviderOwnerObservabilityItem(detail, owner), surfaceId);
}

export function normalizeMetricPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export function formatMetricPercent(value: number) {
  return `${Math.round(value)}%`;
}

function metricLabelsMatch(actual: Record<string, string> | undefined, expected: Record<string, string>) {
  for (const [key, value] of Object.entries(expected)) {
    if ((actual?.[key] || "").trim() !== value) {
      return false;
    }
  }
  return true;
}

function normalizeMetricLabels(labels: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(labels)) {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();
    if (!normalizedKey || !normalizedValue) {
      continue;
    }
    normalized[normalizedKey] = normalizedValue;
  }
  return normalized;
}

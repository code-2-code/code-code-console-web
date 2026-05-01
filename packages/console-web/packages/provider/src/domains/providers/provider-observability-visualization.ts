import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { CLI, Vendor } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderObservabilityOwner } from "./provider-owner-observability-model";
import { findCLI, findVendor } from "./provider-capability-lookup";
import { normalizeProviderOwnerId } from "./provider-owner-id";
import { findVendorSurfaceById } from "./provider-support-surface";
import { providerEndpointCLIID } from "./provider-endpoint-presentation";

export type ResolvedProviderObservabilityOwner = ProviderObservabilityOwner;

export function resolveProviderObservabilityOwner(
  provider: ProviderView | null | undefined,
  vendors: Vendor[] = [],
): ProviderObservabilityOwner | null {
  const surfaceId = provider?.surfaceId?.trim() || "";
  if (!surfaceId) {
    return null;
  }
  const endpoints = provider?.endpoints ?? [];
  const cliId = normalizeProviderOwnerId(endpoints.map(providerEndpointCLIID).find(Boolean) || "");
  if (cliId) {
    return cliId ? { kind: "cli", cliId, surfaceId } : null;
  }
  if (endpoints.some((endpoint) => endpoint.shape.case === "api")) {
    const vendorId = normalizeProviderOwnerId(vendorIDForSurface(vendors, surfaceId) || "");
    return vendorId ? { kind: "vendor", vendorId, surfaceId } : null;
  }
  return null;
}

export function providerSupportsQuotaQuery(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
) {
  return Boolean(resolveProviderQuotaQueryOwner(provider, clis, vendors));
}

export function providerQuotaQueryProviderIDs(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
) {
  const providerID = (provider?.providerId || "").trim();
  if (!providerID) {
    return [];
  }
  return resolveProviderQuotaQueryOwner(provider, clis, vendors) ? [providerID] : [];
}

export function resolveProviderQuotaQueryOwner(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
): ResolvedProviderObservabilityOwner | null {
  if (!provider?.surfaceId?.trim()) {
    return null;
  }
  const owner = resolveProviderObservabilityOwner(provider, vendors);
  if (!owner || !ownerSupportsQuotaQuery(owner, clis, vendors)) {
    return null;
  }
  return owner;
}

function ownerSupportsQuotaQuery(
  owner: ProviderObservabilityOwner | null,
  clis: CLI[],
  vendors: Vendor[],
) {
  if (!owner) {
    return false;
  }
  const capability = owner.kind === "cli"
    ? cliObservabilityCapability(findCLI(clis, owner.cliId), owner.surfaceId)
    : vendorObservabilityCapability(findVendor(vendors, owner.vendorId), owner.surfaceId);
  return capability?.profiles?.some((profile) => profile.collection.case === "quotaQuery") ?? false;
}

function cliObservabilityCapability(cli: CLI | undefined, surfaceId: string) {
  void surfaceId;
  if (!cli?.oauth?.observability) {
    return undefined;
  }
  return cli.oauth.observability;
}

function vendorObservabilityCapability(vendor: Vendor | undefined, surfaceId: string) {
  const normalizedSurfaceId = surfaceId.trim();
  return vendor?.surfaces.find((surface) => (
    surface.surfaceId.trim() === normalizedSurfaceId &&
    surface.observability?.profiles?.some((profile) => profile.collection.case === "quotaQuery")
  ))?.observability;
}

function vendorIDForSurface(vendors: Vendor[], surfaceId: string) {
  const normalizedSurfaceId = surfaceId.trim();
  if (!normalizedSurfaceId) {
    return "";
  }
  return findVendorSurfaceById(vendors, normalizedSurfaceId)?.vendor.vendor?.vendorId || "";
}

import { ProviderSurfaceKind } from "@code-code/agent-contract/provider/v1";
import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { CLI, Vendor } from "@code-code/agent-contract/platform/support/v1";
import type { ProviderObservabilityOwner } from "./provider-owner-observability-model";
import { findCLI, findVendor } from "./provider-capability-lookup";
import { providerSurfaceRuntimeCLIID, providerSurfaceRuntimeKind } from "./provider-runtime-presentation";
import { normalizeProviderOwnerId } from "./provider-owner-id";
import { providerModel } from "./provider-model";

export type ResolvedProviderObservabilityOwner = ProviderObservabilityOwner;

export function resolveProviderObservabilityOwner(
  provider: ProviderView | null | undefined,
  vendors: Vendor[] = [],
): ProviderObservabilityOwner | null {
  const surface = provider ? providerModel(provider).primarySurface() : undefined;
  const runtime = surface?.runtime;
  if (!runtime) {
    return null;
  }
  const surfaceId = surface?.surfaceId?.trim() || "";
  if (!surfaceId) {
    return null;
  }
  if (providerSurfaceRuntimeKind(runtime) === ProviderSurfaceKind.CLI) {
    const cliId = normalizeProviderOwnerId(providerSurfaceRuntimeCLIID(runtime));
    return cliId ? { kind: "cli", cliId, surfaceId } : null;
  }
  if (providerSurfaceRuntimeKind(runtime) === ProviderSurfaceKind.API) {
    const vendorId = normalizeProviderOwnerId(provider?.productInfoId || vendorIDForSurface(vendors, surfaceId) || "");
    return vendorId ? { kind: "vendor", vendorId, surfaceId } : null;
  }
  return null;
}

export function providerSupportsActiveQuery(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
) {
  return Boolean(resolveProviderActiveQueryOwner(provider, clis, vendors));
}

export function providerActiveQueryProviderIDs(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
) {
  const providerID = (provider?.providerId || "").trim();
  if (!providerID) {
    return [];
  }
  return resolveProviderActiveQueryOwner(provider, clis, vendors) ? [providerID] : [];
}

export function resolveProviderActiveQueryOwner(
  provider: ProviderView | null | undefined,
  clis: CLI[],
  vendors: Vendor[],
): ResolvedProviderObservabilityOwner | null {
  const surface = provider ? providerModel(provider).primarySurface() : undefined;
  if (!surface) {
    return null;
  }
  const owner = resolveProviderObservabilityOwner(provider, vendors);
  if (!owner || !ownerSupportsActiveQuery(owner, clis, vendors)) {
    return null;
  }
  return owner;
}

function ownerSupportsActiveQuery(
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
  return capability?.profiles?.some((profile) => profile.collection.case === "activeQuery") ?? false;
}

function cliObservabilityCapability(cli: CLI | undefined, surfaceId: string) {
  if (!cli?.oauth?.observability) {
    return undefined;
  }
  const bindingSurfaceId = cli.oauth.providerBinding?.surfaceId?.trim() || "";
  if (!bindingSurfaceId || bindingSurfaceId !== surfaceId.trim()) {
    return undefined;
  }
  return cli.oauth.observability;
}

function vendorObservabilityCapability(vendor: Vendor | undefined, surfaceId: string) {
  const normalizedSurfaceId = surfaceId.trim();
  return vendor?.providerBindings.find((binding) => (
    binding.providerBinding?.surfaceId?.trim() === normalizedSurfaceId &&
    binding.observability?.profiles?.some((profile) => profile.collection.case === "activeQuery")
  ))?.observability;
}

function vendorIDForSurface(vendors: Vendor[], surfaceId: string) {
  const normalizedSurfaceId = surfaceId.trim();
  if (!normalizedSurfaceId) {
    return "";
  }
  return vendors.find((vendor) => (
    vendor.providerBindings.some((binding) => binding.providerBinding?.surfaceId?.trim() === normalizedSurfaceId)
  ))?.vendor?.vendorId || "";
}

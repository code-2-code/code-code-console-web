import type { ProviderView } from "@code-code/agent-contract/platform/management/v1";
import type { ApiEndpoint, Surface, Vendor } from "@code-code/agent-contract/platform/support/v1";

export function findSupportSurfaceById(surfaces: readonly Surface[] = [], surfaceId?: string | null) {
  const normalizedSurfaceId = surfaceId?.trim() || "";
  if (!normalizedSurfaceId) {
    return undefined;
  }
  return surfaces.find((surface) => surface.surfaceId.trim() === normalizedSurfaceId);
}

export function findVendorSurfaceById(vendors: readonly Vendor[] = [], surfaceId?: string | null) {
  const normalizedSurfaceId = surfaceId?.trim() || "";
  if (!normalizedSurfaceId) {
    return undefined;
  }
  for (const vendor of vendors) {
    const surface = findSupportSurfaceById(vendor.surfaces, normalizedSurfaceId);
    if (surface) {
      return { vendor, surface };
    }
  }
  return undefined;
}

export function supportSurfaceForProvider(
  provider: ProviderView | null | undefined,
  vendors: readonly Vendor[] = [],
  surfaces: readonly Surface[] = [],
) {
  const surfaceId = provider?.surfaceId?.trim() || "";
  return findSupportSurfaceById(surfaces, surfaceId) || findVendorSurfaceById(vendors, surfaceId)?.surface;
}

export function providerProductInfoId(
  provider: ProviderView | null | undefined,
  vendors: readonly Vendor[] = [],
  surfaces: readonly Surface[] = [],
) {
  const surface = supportSurfaceForProvider(provider, vendors, surfaces);
  if (surface?.productInfoId?.trim()) {
    return surface.productInfoId.trim();
  }
  return findVendorSurfaceById(vendors, provider?.surfaceId)?.vendor.vendor?.vendorId?.trim() || "";
}

export function cliIdForSurface(surfaces: readonly Surface[] = [], surfaceId?: string | null) {
  const surface = findSupportSurfaceById(surfaces, surfaceId);
  return surface?.spec.case === "cli" ? surface.spec.value.cliId.trim() : "";
}

export function apiEndpointsForSurface(surface: Surface | undefined): ApiEndpoint[] {
  return surface?.spec.case === "api" ? surface.spec.value.apiEndpoints : [];
}


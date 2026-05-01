import type { ProductInfo } from "@code-code/agent-contract/product-info/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";

export function resolveProductInfo(
  productInfoId?: string,
  productInfos?: ProductInfo[],
  vendors?: Vendor[]
): { displayName: string; iconUrl?: string } | undefined {
  if (!productInfoId) {
    return undefined;
  }

  // 1. Prioritize looking up in the dedicated ProductInfo registry
  if (productInfos && productInfos.length > 0) {
    const info = productInfos.find((p) => p.id === productInfoId);
    if (info) {
      return {
        displayName: info.displayName || info.id,
        iconUrl: info.iconUrl || undefined,
      };
    }
  }

  // 2. Fall back to Vendor registry if ProductInfo not available yet
  if (vendors && vendors.length > 0) {
    const vendor = vendors.find((v) => v.vendor?.vendorId === productInfoId)?.vendor;
    if (vendor) {
      return {
        displayName: vendor.displayName || vendor.vendorId,
        iconUrl: vendor.iconUrl || undefined,
      };
    }
  }

  return undefined;
}

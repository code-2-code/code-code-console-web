import type { Vendor } from "@code-code/agent-contract/platform/support/v1";

export function buildVendorIndex(vendors: Vendor[]) {
  const index: Record<string, Vendor> = {};
  for (const vendor of vendors) {
    for (const key of vendorKeys(vendor)) {
      index[key] = vendor;
    }
  }
  return index;
}

export function vendorLookupKey(value: string) {
  return value.trim().toLowerCase();
}

function vendorKeys(vendor: Vendor) {
  const keys = new Set<string>();
  const vendorId = vendorLookupKey(vendor.vendor?.vendorId || "");
  if (vendorId) {
    keys.add(vendorId);
  }
  for (const alias of vendor.vendor?.aliases || []) {
    const key = vendorLookupKey(alias);
    if (key) {
      keys.add(key);
    }
  }
  return keys;
}

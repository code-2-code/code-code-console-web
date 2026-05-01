import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import "./source-filter-option-registrations";
import {
  listRegisteredSourceFilterOptions,
  registeredSourceFilterOptionLabel,
  type SourceFilterOption
} from "./source-filter-option-registry-store";

type VendorFilterOption = {
  iconUrl?: string;
  label: string;
  value: string;
};

export function buildVendorOptions(vendors: Vendor[]): VendorFilterOption[] {
  return vendors
    .filter((vendor) => Boolean(vendor.vendor?.vendorId))
    .map((vendor) => ({
      iconUrl: vendor.vendor?.iconUrl,
      value: vendor.vendor?.vendorId || "",
      label: vendor.vendor?.displayName || vendor.vendor?.vendorId || ""
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function buildSourceOptions(): SourceFilterOption[] {
  return listRegisteredSourceFilterOptions();
}

export function sourceOptionLabel(sourceId: string): string {
  return registeredSourceFilterOptionLabel(sourceId);
}

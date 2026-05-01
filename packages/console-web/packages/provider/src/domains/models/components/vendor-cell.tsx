import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { Flex, Text } from "@radix-ui/themes";
import { VendorAvatar } from "./vendor-avatar";

type VendorCellProps = {
  fallbackLabel: string;
  vendor?: Vendor;
  iconUrl?: string;
};

export function VendorCell({ fallbackLabel, vendor, iconUrl }: VendorCellProps) {
  const label = vendor?.vendor?.displayName || fallbackLabel;
  return (
    <Flex align="center" gap="2">
      <VendorAvatar displayName={label} iconUrl={iconUrl || vendor?.vendor?.iconUrl} size="2" />
      <Text size="2">{label}</Text>
    </Flex>
  );
}

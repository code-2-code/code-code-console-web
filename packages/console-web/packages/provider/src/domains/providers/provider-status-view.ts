import { ProviderPhase } from "@code-code/agent-contract/platform/provider/v1/shared";

export function providerStatusColor(phase: ProviderPhase | undefined): "green" | "red" | "amber" | "gray" {
  switch (phase) {
    case ProviderPhase.READY:
      return "green";
    case ProviderPhase.REFRESHING:
    case ProviderPhase.STALE:
      return "amber";
    case ProviderPhase.INVALID_CONFIG:
    case ProviderPhase.ERROR:
      return "red";
    default:
      return "gray";
  }
}

export function providerStatusLabel(phase: ProviderPhase | undefined) {
  switch (phase) {
    case ProviderPhase.READY:
      return "Ready";
    case ProviderPhase.INVALID_CONFIG:
      return "Invalid Config";
    case ProviderPhase.REFRESHING:
      return "Refreshing";
    case ProviderPhase.STALE:
      return "Stale";
    case ProviderPhase.ERROR:
      return "Error";
    default:
      return "Unknown";
  }
}

export function providerStatusReason(
  phase: ProviderPhase | undefined,
  reason: string | undefined,
) {
  const normalizedReason = reason?.trim() ?? "";
  if (!normalizedReason) {
    return "";
  }
  if (phase === ProviderPhase.READY) {
    return "";
  }
  return normalizedReason;
}

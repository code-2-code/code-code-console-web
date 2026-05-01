import type { ReactNode } from "react";
import { ErrorCallout, SurfacePanel } from "@code-code/console-web-ui";
import { DetailList, DetailListItem } from "../../../components/detail-list";
import { useProviderAuthenticationSummary } from "../api";
import { type ProviderAuthenticationKind } from "../provider-authentication-view";

type Props = {
  providerId: string;
  providerCredentialId: string;
  kind: ProviderAuthenticationKind;
};

export function ProviderAuthenticationSummary({ providerId, providerCredentialId, kind }: Props) {
  if (!providerCredentialId.trim()) {
    return (
      <ErrorCallout mt="2">Missing authentication record.</ErrorCallout>
    );
  }

  return (
    <AuthenticationDetailsCard
      providerId={providerId}
      providerCredentialId={providerCredentialId}
      kind={kind}
    />
  );
}

function AuthenticationDetailsCard({
  providerId,
  providerCredentialId,
  kind,
}: {
  providerId: string;
  providerCredentialId: string;
  kind: ProviderAuthenticationKind;
}) {
  const { summary, error } = useProviderAuthenticationSummary(providerId);
  const providerFields = visibleSummaryFields(summary?.provider?.fields);
  const observabilityFields = visibleSummaryFields(summary?.observability?.fields);
  return (
    <SurfacePanel cardProps={{ mt: "2" }}>
      <DetailList size="1">
        <AuthenticationItem label="Credential" value={providerCredentialId} />
        {kind === "cliOAuth" ? (
          <AuthenticationItem label="Type" value="CLI OAuth" />
        ) : (
          <AuthenticationItem label="Type" value="API key" />
        )}
        <AuthenticationItem label="Secret" value="Managed by auth service" />
        {providerFields.map((field) => (
          <AuthenticationItem
            key={`provider:${field.fieldId || field.label}`}
            label={field.label || field.fieldId || "Subject"}
            value={field.value}
          />
        ))}
        {observabilityFields.map((field) => (
          <AuthenticationItem
            key={`observability:${field.fieldId || field.label}`}
            label={field.label || field.fieldId || "Observability"}
            value={field.value}
          />
        ))}
        {error ? (
          <AuthenticationItem label="Subject" value="Unavailable" />
        ) : null}
      </DetailList>
    </SurfacePanel>
  );
}

function visibleSummaryFields(fields?: Array<{ fieldId?: string; label?: string; value?: string }>) {
  return (fields || [])
    .map((field) => ({
      fieldId: (field.fieldId || "").trim(),
      label: (field.label || "").trim(),
      value: (field.value || "").trim(),
    }))
    .filter((field) => field.value);
}

function AuthenticationItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <DetailListItem
      label={label}
      labelColor="gray"
      labelSize="1"
      valueSize="1"
    >
      {value}
    </DetailListItem>
  );
}

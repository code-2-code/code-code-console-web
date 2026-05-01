import {
  QuotaQueryInputControl,
  QuotaQueryInputPersistence,
  QuotaQueryInputValueTransform,
  type QuotaQueryInputField,
  type QuotaQueryInputForm,
} from "@code-code/agent-contract/observability/v1";
import type { Vendor } from "@code-code/agent-contract/platform/support/v1";
import { findVendorSurfaceById } from "./provider-support-surface";

export type ProviderObservabilityAuthField = {
  key: string;
  label: string;
  placeholder: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
  sensitive?: boolean;
  multiline?: boolean;
  persistence: QuotaQueryInputPersistence;
  targetFieldId?: string;
  transform: QuotaQueryInputValueTransform;
};

export type ProviderObservabilityAuthPresentation = {
  dialogTitle: string;
  providerActionLabel: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  schemaId: string;
  requiredKeys: string[];
  fields: ProviderObservabilityAuthField[];
  separateProviderUpdate: boolean;
};

export function providerObservabilityAuthPresentation(
  _vendorId?: string | null,
  vendors: Vendor[] = [],
  surfaceId?: string | null,
): ProviderObservabilityAuthPresentation | null {
  const form = providerObservabilityInputForm(vendors, surfaceId);
  if (!form) {
    return null;
  }
  const fields = form.fields
    .map(providerObservabilityAuthField)
    .filter((field): field is ProviderObservabilityAuthField => field !== null);
  if (fields.length === 0) {
    return null;
  }
  const firstField = fields[0];
  return {
    dialogTitle: form.title.trim() || "Update Observability Authentication",
    providerActionLabel: form.actionLabel.trim() || "Update Observability Authentication",
    description: form.description.trim(),
    fieldLabel: firstField.label,
    placeholder: firstField.placeholder,
    schemaId: form.schemaId.trim(),
    requiredKeys: fields
      .filter((field) => field.persistence === QuotaQueryInputPersistence.STORED_MATERIAL && field.required)
      .map((field) => field.key),
    fields,
    separateProviderUpdate: true,
  };
}

function providerObservabilityInputForm(
  vendors: Vendor[] = [],
  surfaceId?: string | null,
): QuotaQueryInputForm | null {
  const surface = findVendorSurfaceById(vendors, surfaceId)?.surface;
  if (!surface) {
    return null;
  }
  for (const profile of surface.observability?.profiles || []) {
    if (profile.collection.case !== "quotaQuery") {
      continue;
    }
    const form = profile.collection.value.inputForm;
    if (form?.schemaId?.trim()) {
      return form;
    }
  }
  return null;
}

function providerObservabilityAuthField(field: QuotaQueryInputField): ProviderObservabilityAuthField | null {
  const key = field.fieldId.trim();
  const label = field.label.trim();
  if (!key || !label) {
    return null;
  }
  return {
    key,
    label,
    description: field.description.trim() || undefined,
    placeholder: field.placeholder.trim(),
    defaultValue: field.defaultValue.trim() || undefined,
    required: field.required,
    sensitive: field.sensitive || field.control === QuotaQueryInputControl.PASSWORD,
    multiline: field.control === QuotaQueryInputControl.TEXTAREA,
    persistence: field.persistence,
    targetFieldId: field.targetFieldId.trim() || undefined,
    transform: field.transform || QuotaQueryInputValueTransform.IDENTITY,
  };
}

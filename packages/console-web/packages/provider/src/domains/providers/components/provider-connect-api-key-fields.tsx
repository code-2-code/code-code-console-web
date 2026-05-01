import { Box } from "@radix-ui/themes";
import type { UseFormReturn } from "react-hook-form";
import { FormSelectField, FormTextField } from "@code-code/console-web-ui";
import { isCustomAPIKeyConnectOption, type ProviderConnectOption } from "../provider-connect-options";
import { type ProviderConnectProtocolOption, type ProviderConnectFormValues } from "../provider-connect-form-model";
import { surfaceBaseURLTemplateParameters } from "../provider-surface-template";

type Props = {
  selectedOption?: ProviderConnectOption;
  methods: UseFormReturn<ProviderConnectFormValues>;
  protocolOptions: readonly ProviderConnectProtocolOption[];
};

export function ProviderConnectAPIKeyFields({ selectedOption, methods, protocolOptions }: Props) {
  const surfaceTemplateFields = selectedOption?.kind === "surfaceApiKey"
    ? surfaceBaseURLTemplateParameters(selectedOption.prefilledSurfaces[0]?.baseUrl || "")
    : [];

  return (
    <>
      <FormTextField
        label="API Key"
        htmlFor="provider-connect-api-key"
        error={methods.formState.errors.apiKey?.message}
        id="provider-connect-api-key"
        type="password"
        autoComplete="current-password"
        placeholder="sk-…"
        inputProps={methods.register("apiKey", { required: "API key is required" })}
      />

      {selectedOption?.kind === "surfaceApiKey" ? (
        <>
          {surfaceTemplateFields.map((field) => (
            <FormTextField
              key={`provider-connect-surface-param:${field}`}
              label={formatSurfaceFieldLabel(field)}
              htmlFor={`provider-connect-surface-param-${field}`}
              error={methods.formState.errors.surfaceParameters?.[field]?.message}
              id={`provider-connect-surface-param-${field}`}
              placeholder={`Enter ${field}`}
              inputProps={methods.register(`surfaceParameters.${field}` as const, {
                validate: (value) => value.trim() ? true : `${formatSurfaceFieldLabel(field)} is required`,
              })}
            />
          ))}
        </>
      ) : null}

      {isCustomAPIKeyConnectOption(selectedOption) ? (
        <>
          <FormTextField
            label="Base URL"
            htmlFor="provider-connect-base-url"
            error={methods.formState.errors.baseUrl?.message}
            id="provider-connect-base-url"
            placeholder="https://api.example.com/v1"
            inputProps={methods.register("baseUrl", {
              validate: (value) => value.trim() ? true : "Base URL is required",
            })}
          />

          <Box>
            <FormSelectField
              label="Protocol"
              value={methods.watch("protocol") || protocolOptions[0].value}
              items={protocolOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              triggerStyle={{ width: "100%" }}
              onValueChange={(value) => methods.setValue("protocol", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}

function formatSurfaceFieldLabel(field: string) {
  return field
    .split("_")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

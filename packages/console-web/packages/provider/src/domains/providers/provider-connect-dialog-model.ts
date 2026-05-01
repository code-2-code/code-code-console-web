import {
  findProviderConnectOption,
  listProviderConnectOptions,
  type ProviderConnectOptionKind,
} from "./provider-connect-options";

export type ProviderConnectDialogCopy = {
  selectLabel: string;
  title: string;
};

export type ProviderConnectDialogOption = ReturnType<typeof listProviderConnectOptions>[number];

export interface ProviderConnectDialogModel {
  copy(): ProviderConnectDialogCopy;
  option(connectOptionId: string): ProviderConnectDialogOption | undefined;
  preferredOption(): ProviderConnectDialogOption | undefined;
  scopedOptions(): ProviderConnectDialogOption[];
  selectedOption(connectOptionId: string): ProviderConnectDialogOption | undefined;
}

class DefaultProviderConnectDialogModel implements ProviderConnectDialogModel {
  private readonly connectOptions: ReturnType<typeof listProviderConnectOptions>;
  private readonly preferredOptionKind?: ProviderConnectOptionKind;

  constructor(
    connectOptions: ReturnType<typeof listProviderConnectOptions>,
    preferredOptionKind?: ProviderConnectOptionKind,
  ) {
    this.connectOptions = connectOptions;
    this.preferredOptionKind = preferredOptionKind;
  }

  copy() {
    switch (this.preferredOptionKind) {
      case "surfaceApiKey":
        return {
          title: "Add Provider with API Key",
          selectLabel: "Provider",
        };
      case "customApiKey":
        return {
          title: "Add Custom API Key Provider",
          selectLabel: "",
        };
      case "cliOAuth":
        return {
          title: "Add Provider with CLI OAuth",
          selectLabel: "CLI",
        };
      default:
        return {
          title: "Add Provider",
          selectLabel: "Add Method",
        };
    }
  }

  option(connectOptionId: string) {
    return findProviderConnectOption(this.scopedOptions(), connectOptionId);
  }

  preferredOption() {
    if (!this.preferredOptionKind) {
      return this.connectOptions[0];
    }
    return this.connectOptions.find((option) => option.kind === this.preferredOptionKind) ?? this.connectOptions[0];
  }

  scopedOptions() {
    if (!this.preferredOptionKind) {
      return this.connectOptions;
    }
    return this.connectOptions.filter((option) => option.kind === this.preferredOptionKind);
  }

  selectedOption(connectOptionId: string) {
    return this.option(connectOptionId) ?? this.preferredOption();
  }
}

export function providerConnectDialogModel(
  connectOptions: ReturnType<typeof listProviderConnectOptions>,
  preferredOptionKind?: ProviderConnectOptionKind,
): ProviderConnectDialogModel {
  return new DefaultProviderConnectDialogModel(connectOptions, preferredOptionKind);
}

export function resolveProviderConnectOptionsError(
  errors: unknown[],
  hasError: boolean,
) {
  if (!hasError) {
    return undefined;
  }
  for (const error of errors) {
    if (error instanceof Error) {
      return error;
    }
  }
  return new Error("Failed to load provider connect options.");
}

import type { ProviderModel } from "./provider-model";

export function providerPrimaryProviderModelIDs(provider: ProviderModel) {
  const models = provider.raw.models ?? [];
  return models
    .map((model) => model.providerModelId.trim())
    .filter(Boolean);
}

export function providerHasPrimaryModel(provider: ProviderModel, modelIDs: readonly string[]) {
  const expected = new Set(modelIDs.map((modelID: string) => modelID.trim()).filter(Boolean));
  if (!expected.size) {
    return false;
  }
  return providerPrimaryProviderModelIDs(provider).some((modelID) => expected.has(modelID));
}

export function providerHasPrimaryModelID(provider: ProviderModel, modelID: string) {
  const normalizedModelID = modelID.trim();
  if (!normalizedModelID) {
    return false;
  }
  return providerPrimaryProviderModelIDs(provider).includes(normalizedModelID);
}

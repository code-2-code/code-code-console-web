import type { ProviderModel } from "@code-code/agent-contract/provider/v1";
import { Flex } from "@radix-ui/themes";
import { NoDataCallout, SoftBadge } from "@code-code/console-web-ui";
import { describeProviderModel } from "../provider-model-presentation";

type Props = {
  models?: ProviderModel[];
};

export function ProviderModelBadges({ models = [] }: Props) {
  if (!models.length) {
    return <NoDataCallout size="1">No provider models.</NoDataCallout>;
  }

  return (
    <Flex wrap="wrap" gap="2">
      {models.map((model) => {
        const presentation = describeProviderModel(model);
        return (
          <SoftBadge
            key={presentation.key}
            color="gray"
            size="1"
            title={presentation.detail || undefined}
            label={presentation.label}
          />
        );
      })}
    </Flex>
  );
}

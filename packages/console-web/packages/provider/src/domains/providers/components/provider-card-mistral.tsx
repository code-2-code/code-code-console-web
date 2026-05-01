import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { ActionIconButton, CloseIcon, MetricsIcon } from "@code-code/console-web-ui";
import { ProviderQuotaCard } from "./provider-quota-card";
import { readMistralQuotaSummary, readMistralUsageDetailsSummary } from "./provider-card-mistral-summary";
import type { ProviderCardRendererContext } from "../provider-card-registry";

type Props = ProviderCardRendererContext;

export function ProviderCardMistral({ observability, observabilityError, isLoading, status }: Props) {
  const summary = readMistralQuotaSummary(observability, new Date());
  const detailsSummary = readMistralUsageDetailsSummary(observability, new Date());
  const stopCardOpen = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
  };

  return (
    <Dialog.Root>
      <ProviderQuotaCard
        title="Usage"
        loading={isLoading}
        error={observabilityError}
        rows={summary?.rows ?? []}
        status={status}
        updatedAtLabel={summary?.updatedAtLabel}
        updatedAtTimestamp={summary?.updatedAtTimestamp}
        titleSuffix={<Text size="1" color="gray">Mistral Admin</Text>}
        controls={detailsSummary?.rows.length ? <MistralUsageDrawerTrigger /> : null}
      />
      <Dialog.Content
        aria-describedby={undefined}
        style={mistralUsageDrawerStyle}
        onClick={stopCardOpen}
        onKeyDown={stopCardOpen}
      >
        <Flex align="start" justify="between" gap="3" mb="4">
          <Box>
            <Dialog.Title mb="1">Mistral usage</Dialog.Title>
            <Text size="2" color="gray">Admin billing usage and quota details</Text>
          </Box>
          <Dialog.Close>
            <ActionIconButton label="Close Mistral usage details" title="Close">
              <CloseIcon />
            </ActionIconButton>
          </Dialog.Close>
        </Flex>
        <ProviderQuotaCard
          title="Usage details"
          loading={isLoading}
          error={observabilityError}
          rows={detailsSummary?.rows ?? []}
          updatedAtLabel={detailsSummary?.updatedAtLabel}
          updatedAtTimestamp={detailsSummary?.updatedAtTimestamp}
          showAllRows
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}

function MistralUsageDrawerTrigger() {
  const stopCardOpen = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
  };
  return (
    <Dialog.Trigger style={{ display: "contents" }}>
      <Button
        size="1"
        variant="soft"
        color="gray"
        onClick={stopCardOpen}
        onKeyDown={stopCardOpen}
      >
        <MetricsIcon />
        Usage details
      </Button>
    </Dialog.Trigger>
  );
}

const mistralUsageDrawerStyle = {
  position: "fixed",
  insetBlock: 0,
  insetInlineEnd: 0,
  width: "min(440px, calc(100vw - 24px))",
  maxWidth: "none",
  height: "100vh",
  maxHeight: "100vh",
  margin: 0,
  borderRadius: 0,
  overflowY: "auto",
  boxShadow: "var(--shadow-6)",
} satisfies CSSProperties;

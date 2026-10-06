"use client";

import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Popover } from "@astryxdesign/core/Popover";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { ListChecks } from "lucide-react";

export type ResolveProgress = {
  done: number;
  total: number;
  found: number;
  dropped: number;
};

type ResolveStatusSummaryProps = {
  progress: ResolveProgress;
  isPulsing?: boolean;
  skippedLabel?: string | null;
};

type ResolveStatusMatchCountsProps = {
  progress: ResolveProgress;
  skippedLabel?: string | null;
  isCentered?: boolean;
};

export function ResolveStatusMatchCounts({
  progress,
  skippedLabel,
  isCentered = false,
}: ResolveStatusMatchCountsProps) {
  return (
    <VStack gap={2} width="100%" align={isCentered ? "center" : "stretch"}>
      <HStack
        gap={4}
        align="center"
        width="100%"
        justify={isCentered ? "center" : "start"}
      >
        <HStack gap={2} align="center">
          <StatusDot variant="success" label="Found" />
          <Text type="body" color="secondary">
            {progress.found} found
          </Text>
        </HStack>
        <HStack gap={2} align="center">
          <StatusDot variant="error" label="Not found" />
          <Text type="body" color="secondary">
            {progress.dropped} not found
          </Text>
        </HStack>
      </HStack>
      {skippedLabel ? (
        <Text
          type="supporting"
          color="secondary"
          justify={isCentered ? "center" : "start"}
        >
          {skippedLabel}
        </Text>
      ) : null}
    </VStack>
  );
}

export function ResolveStatusSummary({
  progress,
  isPulsing = false,
  skippedLabel,
}: ResolveStatusSummaryProps) {
  return (
    <VStack gap={2} width="100%">
      <HStack gap={2} align="center" width="100%">
        <StatusDot variant="accent" label="Processed" isPulsing={isPulsing} />
        <Text type="body" color="secondary">
          {progress.done}/{progress.total} processed
        </Text>
      </HStack>
      <HStack gap={2} align="center" width="100%">
        <StatusDot variant="success" label="Found" />
        <Text type="body" color="secondary">
          {progress.found} found
        </Text>
      </HStack>
      <HStack gap={2} align="center" width="100%">
        <StatusDot variant="error" label="Not found" />
        <Text type="body" color="secondary">
          {progress.dropped} not found
        </Text>
      </HStack>
      {skippedLabel ? (
        <Text type="supporting" color="secondary">
          {skippedLabel}
        </Text>
      ) : null}
    </VStack>
  );
}

type ResolveStatusPopoverButtonProps = ResolveStatusSummaryProps;

export function ResolveStatusPopoverButton(props: ResolveStatusPopoverButtonProps) {
  return (
    <Popover
      label="Lookup summary"
      placement="above"
      alignment="end"
      content={<ResolveStatusSummary {...props} />}
    >
      <IconButton
        label="Lookup summary"
        tooltip="Lookup summary"
        variant="ghost"
        size="sm"
        icon={<Icon icon={ListChecks} size="sm" />}
      />
    </Popover>
  );
}

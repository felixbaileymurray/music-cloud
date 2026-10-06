"use client";

import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export type ResolveProgress = {
  done: number;
  total: number;
  found: number;
  dropped: number;
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

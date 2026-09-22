"use client";

import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Lock } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  AppleMusicIcon,
  SpotifyIcon,
  YoutubeMusicIcon,
} from "@/components/streaming-service-icons";
import type { TrackDetails } from "@/lib/types";
import {
  streamingLinks,
  type StreamingService,
} from "@/lib/utils";

const STREAMING_ICONS: Record<
  StreamingService,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  spotify: SpotifyIcon,
  appleMusic: AppleMusicIcon,
  youtubeMusic: YoutubeMusicIcon,
};

function formatDuration(totalSec: number) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatReleaseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TrackInfoCard({
  details,
  isLoading,
  error,
  isLocked = false,
}: {
  details: TrackDetails | null;
  isLoading: boolean;
  error: string | null;
  isLocked?: boolean;
}) {
  return (
    <VStack gap={4} width="100%" align="stretch">
      <HStack gap={2} width="100%" justify="between" align="center">
        <Text type="supporting">Track</Text>
        {isLocked ? (
          <Icon icon={Lock} size="xsm" color="secondary" label="Track locked" />
        ) : null}
      </HStack>

      {isLoading ? (
        <VStack gap={3} width="100%" align="center" paddingBlock={4}>
          <Spinner label="Loading track" size="md" />
        </VStack>
      ) : null}

      {!isLoading && error ? (
        <Text type="body" color="secondary">
          {error}
        </Text>
      ) : null}

      {!isLoading && !error && !details ? (
        <EmptyState
          title="No track in focus"
          description="Hover covers to hear the track snippet and see details. Click to lock a track while you explore."
          headingLevel={3}
          isCompact
        />
      ) : null}

      {!isLoading && details ? (
        <VStack gap={4} width="100%" align="stretch">
          <AspectRatio ratio={1} fit="cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={details.coverUrl} alt="" />
          </AspectRatio>

          <VStack gap={1} width="100%">
            <Heading level={3}>{details.track}</Heading>
            <Text color="secondary">{details.artist}</Text>
          </VStack>
          <HStack gap={1} vAlign="center">
            {streamingLinks(details.track, details.artist).map((link) => (
              <IconButton
                key={link.id}
                label={`Open in ${link.label}`}
                tooltip={link.label}
                variant="ghost"
                size="sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                icon={<Icon icon={STREAMING_ICONS[link.id]} size="sm" />}
              />
            ))}
          </HStack>

          <MetadataList columns="single" label={{ position: "start", width: 88 }}>
            {typeof details.durationSec === "number" ? (
              <MetadataListItem label="Length">
                {formatDuration(details.durationSec)}
              </MetadataListItem>
            ) : null}
            {details.releaseDate ? (
              <MetadataListItem label="Released">
                {formatReleaseDate(details.releaseDate)}
              </MetadataListItem>
            ) : null}
            {details.album ? (
              <MetadataListItem label="Album">{details.album}</MetadataListItem>
            ) : null}
          </MetadataList>
        </VStack>
      ) : null}
    </VStack>
  );
}

"use client";

import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { AudioLines, Lock } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  AppleMusicIcon,
  SpotifyIcon,
  YoutubeMusicIcon,
} from "@/components/streaming-service-icons";
import type { AlbumDetails, AlbumTrack, ClipRef } from "@/lib/types";
import {
  previewUrlKey,
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
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
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

function trackMatchesClip(track: AlbumTrack, clip: ClipRef | null) {
  if (!clip) return false;
  if (clip.kind === "deezer") {
    return track.deezerTrackId === clip.trackId;
  }
  if (!track.previewUrl) return false;
  return previewUrlKey(track.previewUrl) === previewUrlKey(clip.url);
}

export function AlbumInfoCard({
  details,
  listenCount,
  isLoading,
  error,
  activeClip = null,
  isLocked = false,
}: {
  details: AlbumDetails | null;
  listenCount?: number;
  isLoading: boolean;
  error: string | null;
  activeClip?: ClipRef | null;
  isLocked?: boolean;
}) {
  return (
    <VStack gap={4} width="100%" align="stretch">
      <VStack gap={1} width="100%">
        <HStack
          gap={2}
          width="100%"
          justify="between"
          align="center"
        >
          <Text type="supporting">Album</Text>
          {isLocked ? (
            <Icon icon={Lock} size="xsm" color="secondary" label="Album locked" />
          ) : null}
        </HStack>
        <Text type="body" color="secondary">
          {details
            ? `${details.album} · ${details.artist}`
            : isLoading
              ? "Loading album details…"
              : "Hover a cover to explore"}
        </Text>
      </VStack>

      {isLoading ? (
        <VStack gap={3} width="100%" align="center" paddingBlock={4}>
          <Spinner label="Loading album" size="md" />
        </VStack>
      ) : null}

      {!isLoading && error ? (
        <Text type="body" color="secondary">
          {error}
        </Text>
      ) : null}

      {!isLoading && !error && !details ? (
        <EmptyState
          title="No album in focus"
          description="Hover covers to hear snippets and see details. Click to lock an album so you can keep reading while you explore."
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

          <VStack gap={2} width="100%">
            <VStack gap={1} width="100%">
              <Heading level={3}>{details.album}</Heading>
              <Text color="secondary">{details.artist}</Text>
            </VStack>
            <HStack gap={1} vAlign="center">
              {streamingLinks(details.album, details.artist).map((link) => (
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
            {details.genre ? <Token label={details.genre} size="sm" /> : null}
          </VStack>

          <MetadataList columns="single" label={{ position: "start", width: 88 }}>
            {typeof listenCount === "number" ? (
              <MetadataListItem label="Listens">
                {listenCount.toLocaleString()}
              </MetadataListItem>
            ) : null}
            {details.trackCount ? (
              <MetadataListItem label="Tracks">
                {details.trackCount}
              </MetadataListItem>
            ) : null}
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
            {details.label ? (
              <MetadataListItem label="Label">{details.label}</MetadataListItem>
            ) : null}
            <MetadataListItem label="Source">
              {details.source === "deezer" ? "Deezer" : "iTunes"}
            </MetadataListItem>
          </MetadataList>

          {details.tracks.length > 0 ? (
            <VStack gap={2} width="100%" align="stretch">
              <Text weight="semibold">Tracklist</Text>
              <List hasDividers density="compact">
                {details.tracks.map((track, index) => {
                  const isPreviewing = trackMatchesClip(track, activeClip);
                  return (
                    <ListItem
                      key={`${track.position ?? index}-${track.title}`}
                      label={track.title}
                      startContent={
                        isPreviewing ? (
                          <Text as="span" className="album-preview-icon">
                            <Icon
                              icon={AudioLines}
                              size="sm"
                              color="accent"
                              label="Playing snippet"
                            />
                          </Text>
                        ) : (
                          <Text type="supporting">
                            {track.position ?? index + 1}
                          </Text>
                        )
                      }
                      endContent={
                        typeof track.durationSec === "number" ? (
                          <Text type="supporting">
                            {formatDuration(track.durationSec)}
                          </Text>
                        ) : undefined
                      }
                    />
                  );
                })}
              </List>
            </VStack>
          ) : null}
        </VStack>
      ) : null}
    </VStack>
  );
}

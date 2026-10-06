"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { AlbumInfoCard } from "@/components/album-info-card";
import { TrackInfoCard } from "@/components/track-info-card";
import type {
  AlbumDetails,
  CloudKind,
  ClipRef,
  TrackDetails,
} from "@/lib/types";

export function CloudInfoPanel({
  kind,
  albumDetails,
  trackDetails,
  albumLoading,
  trackLoading,
  albumError,
  trackError,
  activeClip,
}: {
  kind: CloudKind;
  albumDetails: AlbumDetails | null;
  trackDetails: TrackDetails | null;
  albumLoading: boolean;
  trackLoading: boolean;
  albumError: string | null;
  trackError: string | null;
  activeClip: ClipRef | null;
}) {
  if (kind === "artist") {
    return (
      <EmptyState
        title="Artist clouds"
        description="Coming soon."
        headingLevel={3}
        isCompact
      />
    );
  }

  if (kind === "track") {
    return (
      <TrackInfoCard
        details={trackDetails}
        isLoading={trackLoading}
        error={trackError}
      />
    );
  }

  return (
    <AlbumInfoCard
      details={albumDetails}
      isLoading={albumLoading}
      error={albumError}
      activeClip={activeClip}
    />
  );
}

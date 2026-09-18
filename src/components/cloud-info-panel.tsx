"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { AlbumInfoCard } from "@/components/album-info-card";
import { TrackInfoCard } from "@/components/track-info-card";
import type {
  AlbumDetails,
  CloudHit,
  CloudKind,
  ClipRef,
  PreviewHit,
  TrackDetails,
  TrackHit,
} from "@/lib/types";

export function CloudInfoPanel({
  kind,
  focused,
  albumDetails,
  trackDetails,
  albumLoading,
  trackLoading,
  albumError,
  trackError,
  activeClip,
  isLocked,
}: {
  kind: CloudKind;
  focused: CloudHit | null;
  albumDetails: AlbumDetails | null;
  trackDetails: TrackDetails | null;
  albumLoading: boolean;
  trackLoading: boolean;
  albumError: string | null;
  trackError: string | null;
  activeClip: ClipRef | null;
  isLocked: boolean;
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
    const trackFocused = focused as TrackHit | null;
    return (
      <TrackInfoCard
        details={trackDetails}
        weight={trackFocused?.listenCount}
        isLoading={trackLoading}
        error={trackError}
        isLocked={isLocked}
      />
    );
  }

  const albumFocused = focused as PreviewHit | null;
  return (
    <AlbumInfoCard
      details={albumDetails}
      listenCount={albumFocused?.listenCount}
      isLoading={albumLoading}
      error={albumError}
      activeClip={activeClip}
      isLocked={isLocked}
    />
  );
}

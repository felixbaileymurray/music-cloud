import type { CloudHit, ClipRef, CloudKind, PreviewHit, TrackHit } from "@/lib/types";

export type HoverPreview = {
  clip: ClipRef;
  album: string;
  artist: string;
  track?: string;
};

export function cloudNodeId(kind: CloudKind, hit: CloudHit): string {
  if (kind === "track" && "track" in hit) {
    return `${hit.artist}::${hit.track}`;
  }
  const albumHit = hit as PreviewHit;
  return `${albumHit.artist}::${albumHit.album}`;
}

export function cloudNodeLabel(kind: CloudKind, hit: CloudHit): string {
  if (kind === "track" && "track" in hit) {
    return `${hit.track} by ${hit.artist}`;
  }
  const albumHit = hit as PreviewHit;
  return `${albumHit.album} by ${albumHit.artist}`;
}

export function hoverPreviewFromHit(
  kind: CloudKind,
  hit: CloudHit,
  clip: ClipRef
): HoverPreview {
  if (kind === "track" && "track" in hit) {
    return {
      clip,
      track: hit.track,
      artist: hit.artist,
      album: hit.album ?? hit.track,
    };
  }
  const albumHit = hit as PreviewHit;
  return { clip, album: albumHit.album, artist: albumHit.artist };
}

export function hitsMatchFocus(
  kind: CloudKind,
  focused: CloudHit,
  preview: HoverPreview | null
): boolean {
  if (!preview) return false;
  if (kind === "track" && "track" in focused) {
    return (
      focused.track === preview.track &&
      focused.artist === preview.artist
    );
  }
  const albumHit = focused as PreviewHit;
  return (
    albumHit.album === preview.album && albumHit.artist === preview.artist
  );
}

export function sameCloudHit(kind: CloudKind, a: CloudHit, b: CloudHit): boolean {
  return cloudNodeId(kind, a) === cloudNodeId(kind, b);
}

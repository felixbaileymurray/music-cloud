export type CloudKind = "album" | "track" | "artist";

export type AlbumArtist = {
  album: string;
  artist: string;
};

export type AlbumListen = AlbumArtist & {
  listenCount: number;
};

export type TrackListen = {
  track: string;
  artist: string;
  album?: string;
  listenCount: number;
};

export type TrackQuery = {
  track: string;
  artist: string;
  album?: string;
};

/** Stable clip identity — Deezer URLs expire; track IDs do not. */
export type ClipRef =
  | { kind: "deezer"; trackId: number }
  | { kind: "itunes"; url: string };

export type PreviewMatch = {
  coverUrl: string;
  album: string;
  artist: string;
  clips: ClipRef[];
};

export type PreviewHit = AlbumListen & PreviewMatch;

export type TrackPreviewMatch = {
  coverUrl: string;
  track: string;
  artist: string;
  album?: string;
  clips: ClipRef[];
};

export type TrackHit = TrackListen & TrackPreviewMatch;

export type CloudHit = PreviewHit | TrackHit;

export function isTrackHit(hit: CloudHit): hit is TrackHit {
  return "track" in hit && typeof hit.track === "string";
}

export type AlbumTrack = {
  title: string;
  durationSec?: number;
  position?: number;
  previewUrl?: string;
  deezerTrackId?: number;
};

export type AlbumDetails = {
  album: string;
  artist: string;
  coverUrl: string;
  genres?: string[];
  releaseDate?: string;
  label?: string;
  trackCount?: number;
  durationSec?: number;
  tracks: AlbumTrack[];
  source: "deezer" | "itunes";
};

export type TrackDetails = {
  track: string;
  artist: string;
  album?: string;
  coverUrl: string;
  durationSec?: number;
  releaseDate?: string;
  source: "deezer" | "itunes";
};

export type ParseIssue = {
  code: "empty" | "unreadable" | "no-album-artist" | "no-track-artist" | "unknown-format";
  detail: string;
};

export type ParseResult = {
  kind: "album";
  listens: AlbumListen[];
  skippedRows: number;
  sourceLabel: string;
  issues: ParseIssue[];
};

export type TrackParseResult = {
  kind: "track";
  listens: TrackListen[];
  skippedRows: number;
  sourceLabel: string;
  issues: ParseIssue[];
};

export type AnyParseResult = ParseResult | TrackParseResult;

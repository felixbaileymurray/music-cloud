export type AlbumArtist = {
  album: string;
  artist: string;
};

export type AlbumListen = AlbumArtist & {
  listenCount: number;
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
  genre?: string;
  releaseDate?: string;
  label?: string;
  trackCount?: number;
  durationSec?: number;
  tracks: AlbumTrack[];
  source: "deezer" | "itunes";
};

export type ParseIssue = {
  code: "empty" | "unreadable" | "no-album-artist" | "unknown-format";
  detail: string;
};

export type ParseResult = {
  listens: AlbumListen[];
  skippedRows: number;
  sourceLabel: string;
  issues: ParseIssue[];
};

export type AlbumArtist = {
  album: string;
  artist: string;
};

export type AlbumListen = AlbumArtist & {
  listenCount: number;
};

export type PreviewHit = AlbumListen & {
  coverUrl: string;
  previews: string[];
};

export type AlbumTrack = {
  title: string;
  durationSec?: number;
  position?: number;
  previewUrl?: string;
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

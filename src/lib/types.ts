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

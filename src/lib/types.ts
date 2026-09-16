export type CoverMotif = "rings" | "grid" | "split" | "orbit" | "bars" | "arc";

export type AlbumCover = {
  from: string;
  to: string;
  accent: string;
  motif: CoverMotif;
};

export type Track = {
  id: string;
  albumId: string;
  title: string;
  duration: number;
  src: string;
  imported?: boolean;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  liner: string;
  cover: AlbumCover;
  trackIds: string[];
};

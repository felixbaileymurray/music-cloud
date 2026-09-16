import { cacheKey } from "@/lib/normalize";
import type { AlbumArtist } from "@/lib/types";

export type CachedPreview = {
  coverUrl: string;
  previews: string[];
  album: string;
  artist: string;
} | null;

const memory = new Map<string, CachedPreview>();

export function getCachedPreview(query: AlbumArtist) {
  return memory.get(cacheKey(query.album, query.artist));
}

export function setCachedPreview(query: AlbumArtist, value: CachedPreview) {
  memory.set(cacheKey(query.album, query.artist), value);
}

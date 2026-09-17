import { lookupDeezerAlbumDetails } from "@/lib/deezer";
import { lookupItunesAlbumDetails } from "@/lib/itunes";
import type { AlbumArtist, AlbumDetails } from "@/lib/types";

const memory = new Map<string, AlbumDetails | null>();

function detailsKey(query: AlbumArtist) {
  return `${query.album.trim().toLowerCase()}::${query.artist.trim().toLowerCase()}`;
}

export async function resolveAlbumDetails(
  query: AlbumArtist
): Promise<AlbumDetails | null> {
  const album = query.album.trim();
  const artist = query.artist.trim();
  if (!album || !artist) return null;

  const key = detailsKey({ album, artist });
  if (memory.has(key)) return memory.get(key) ?? null;

  try {
    const deezer = await lookupDeezerAlbumDetails({ album, artist });
    if (deezer) {
      memory.set(key, deezer);
      return deezer;
    }
  } catch {
    // Fall through to iTunes.
  }

  try {
    const itunes = await lookupItunesAlbumDetails({ album, artist });
    memory.set(key, itunes);
    return itunes;
  } catch {
    memory.set(key, null);
    return null;
  }
}

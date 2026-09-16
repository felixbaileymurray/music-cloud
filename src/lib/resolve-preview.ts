import { lookupDeezer } from "@/lib/deezer";
import { lookupItunes } from "@/lib/itunes";
import { getCachedPreview, setCachedPreview } from "@/lib/preview-cache";
import type { AlbumArtist } from "@/lib/types";

export async function resolvePreview(query: AlbumArtist) {
  const album = query.album.trim();
  const artist = query.artist.trim();
  if (!album || !artist) return null;

  const cached = getCachedPreview({ album, artist });
  if (cached !== undefined) return cached;

  try {
    const itunes = await lookupItunes({ album, artist });
    if (itunes) {
      setCachedPreview({ album, artist }, itunes);
      return itunes;
    }
  } catch {
    // Fall through to Deezer.
  }

  try {
    const deezer = await lookupDeezer({ album, artist });
    setCachedPreview({ album, artist }, deezer);
    return deezer;
  } catch {
    setCachedPreview({ album, artist }, null);
    return null;
  }
}

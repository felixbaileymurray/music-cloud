import { lookupDeezerTrack } from "@/lib/deezer";
import { lookupItunesTrack } from "@/lib/itunes";
import { cacheKey } from "@/lib/normalize";
import type { TrackPreviewMatch, TrackQuery } from "@/lib/types";

const memory = new Map<string, TrackPreviewMatch | null>();

function memoryKey(query: TrackQuery) {
  return cacheKey(query.track, query.artist);
}

export async function resolveTrackPreview(
  query: TrackQuery
): Promise<TrackPreviewMatch | null> {
  const key = memoryKey(query);
  if (memory.has(key)) {
    return memory.get(key) ?? null;
  }

  try {
    const deezer = await lookupDeezerTrack(query);
    if (deezer) {
      memory.set(key, deezer);
      return deezer;
    }
  } catch {
    // fall through
  }

  try {
    const itunes = await lookupItunesTrack(query);
    memory.set(key, itunes);
    return itunes;
  } catch {
    memory.set(key, null);
    return null;
  }
}

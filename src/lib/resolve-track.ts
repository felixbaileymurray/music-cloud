import { lookupDeezerTrackDetails } from "@/lib/deezer";
import { lookupItunesTrackDetails } from "@/lib/itunes";
import { cacheKey } from "@/lib/normalize";
import type { TrackDetails, TrackQuery } from "@/lib/types";

const memory = new Map<string, TrackDetails | null>();

export async function resolveTrackDetails(
  query: TrackQuery
): Promise<TrackDetails | null> {
  const key = cacheKey(query.track, query.artist);
  if (memory.has(key)) {
    return memory.get(key) ?? null;
  }

  try {
    const deezer = await lookupDeezerTrackDetails(query);
    if (deezer) {
      memory.set(key, deezer);
      return deezer;
    }
  } catch {
    // fall through
  }

  try {
    const itunes = await lookupItunesTrackDetails(query);
    memory.set(key, itunes);
    return itunes;
  } catch {
    memory.set(key, null);
    return null;
  }
}

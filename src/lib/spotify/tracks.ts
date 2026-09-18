import type { TrackListen } from "@/lib/types";

type SpotifyArtist = { name: string };
type SpotifyAlbum = { name: string };
type SpotifyTrackItem = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
};

type SpotifyTopTracks = { items: SpotifyTrackItem[] };
type SpotifyRecentlyPlayed = {
  items: Array<{ played_at: string; track: SpotifyTrackItem }>;
};
type SpotifySavedTracks = {
  items: Array<{ added_at: string; track: SpotifyTrackItem }>;
};

export type SpotifyTrackSource = "top" | "recent" | "saved";
export type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

function mapTrack(item: SpotifyTrackItem, weight: number): TrackListen {
  const artist = item.artists[0]?.name?.trim() || "Unknown artist";
  return {
    track: item.name.trim(),
    artist,
    album: item.album.name?.trim() || undefined,
    listenCount: weight,
  };
}

function weightByIndex(index: number, total: number) {
  return Math.max(1, total - index);
}

export function tracksFromTop(items: SpotifyTrackItem[]): TrackListen[] {
  const n = items.length;
  return items.map((item, index) => mapTrack(item, weightByIndex(index, n)));
}

export function tracksFromRecentlyPlayed(
  items: SpotifyRecentlyPlayed["items"]
): TrackListen[] {
  const seen = new Map<string, TrackListen>();
  const order: string[] = [];

  for (const entry of items) {
    const id = entry.track.id;
    if (seen.has(id)) {
      const existing = seen.get(id)!;
      existing.listenCount += 1;
      continue;
    }
    const listen: TrackListen = {
      track: entry.track.name.trim(),
      artist: entry.track.artists[0]?.name?.trim() || "Unknown artist",
      album: entry.track.album.name?.trim() || undefined,
      listenCount: 1,
    };
    seen.set(id, listen);
    order.push(id);
  }

  const n = order.length;
  return order.map((id, index) => {
    const row = seen.get(id)!;
    const recency = weightByIndex(index, n);
    return { ...row, listenCount: Math.max(row.listenCount, recency) };
  });
}

export function tracksFromSaved(
  items: SpotifySavedTracks["items"]
): TrackListen[] {
  const n = items.length;
  return items.map((entry, index) =>
    mapTrack(entry.track, weightByIndex(index, n))
  );
}

export async function fetchSpotifyTracks(
  source: SpotifyTrackSource,
  timeRange: SpotifyTimeRange,
  spotifyGet: <T>(path: string) => Promise<T>
): Promise<{ listens: TrackListen[]; sourceLabel: string }> {
  if (source === "top") {
    const data = await spotifyGet<SpotifyTopTracks>(
      `/me/top/tracks?limit=50&time_range=${timeRange}`
    );
    return {
      listens: tracksFromTop(data.items ?? []),
      sourceLabel: `spotify top (${timeRange})`,
    };
  }

  if (source === "recent") {
    const data = await spotifyGet<SpotifyRecentlyPlayed>(
      `/me/player/recently-played?limit=50`
    );
    return {
      listens: tracksFromRecentlyPlayed(data.items ?? []),
      sourceLabel: "spotify recently played",
    };
  }

  const data = await spotifyGet<SpotifySavedTracks>(
    `/me/tracks?limit=50`
  );
  return {
    listens: tracksFromSaved(data.items ?? []),
    sourceLabel: "spotify recently saved",
  };
}

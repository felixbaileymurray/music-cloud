import { namesMatch } from "@/lib/normalize";
import type { AlbumArtist, AlbumDetails, AlbumTrack } from "@/lib/types";

type DeezerAlbum = {
  id: number;
  title: string;
  cover_xl?: string;
  cover_medium?: string;
  artist?: { name?: string };
};

type DeezerAlbumFull = DeezerAlbum & {
  label?: string;
  nb_tracks?: number;
  duration?: number;
  release_date?: string;
  genres?: { data?: Array<{ name?: string }> };
};

type DeezerSearchResponse = {
  data?: DeezerAlbum[];
};

type DeezerTrack = {
  title?: string;
  preview?: string;
  rank?: number;
  duration?: number;
  track_position?: number;
};

type DeezerTracksResponse = {
  data?: DeezerTrack[];
};

async function deezerJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Deezer HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

async function findDeezerAlbum(query: AlbumArtist): Promise<DeezerAlbum | null> {
  const q = encodeURIComponent(`album:"${query.album}" artist:"${query.artist}"`);
  const search = await deezerJson<DeezerSearchResponse>(
    `https://api.deezer.com/search/album?q=${q}&limit=5`
  );
  let album = (search.data ?? []).find(
    (result) =>
      namesMatch(result.title, query.album) &&
      namesMatch(result.artist?.name ?? "", query.artist)
  );

  if (!album) {
    const fallbackQ = encodeURIComponent(`${query.album} ${query.artist}`);
    const fallback = await deezerJson<DeezerSearchResponse>(
      `https://api.deezer.com/search/album?q=${fallbackQ}&limit=5`
    );
    album = (fallback.data ?? []).find(
      (result) =>
        namesMatch(result.title, query.album) &&
        namesMatch(result.artist?.name ?? "", query.artist)
    );
  }

  return album ?? null;
}

export async function lookupDeezer(query: AlbumArtist) {
  const album = await findDeezerAlbum(query);
  if (!album) return null;

  const tracks = await deezerJson<DeezerTracksResponse>(
    `https://api.deezer.com/album/${album.id}/tracks?limit=50`
  );
  const previews = [...(tracks.data ?? [])]
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((track) => track.preview)
    .filter((url): url is string => Boolean(url))
    .slice(0, 3);

  const coverUrl = album.cover_xl || album.cover_medium;
  if (!coverUrl || previews.length === 0) return null;

  return {
    coverUrl,
    previews,
    album: album.title,
    artist: album.artist?.name ?? query.artist,
  };
}

function mapDeezerTracks(tracks: DeezerTrack[]): AlbumTrack[] {
  return [...tracks]
    .sort(
      (a, b) =>
        (a.track_position ?? Number.MAX_SAFE_INTEGER) -
        (b.track_position ?? Number.MAX_SAFE_INTEGER)
    )
    .map((track) => ({
      title: track.title?.trim() || "Untitled",
      durationSec:
        typeof track.duration === "number" && track.duration > 0
          ? track.duration
          : undefined,
      position:
        typeof track.track_position === "number"
          ? track.track_position
          : undefined,
      previewUrl: track.preview || undefined,
    }))
    .filter((track) => track.title.length > 0);
}

export async function lookupDeezerAlbumDetails(
  query: AlbumArtist
): Promise<AlbumDetails | null> {
  const match = await findDeezerAlbum(query);
  if (!match) return null;

  const [full, tracksResponse] = await Promise.all([
    deezerJson<DeezerAlbumFull>(`https://api.deezer.com/album/${match.id}`),
    deezerJson<DeezerTracksResponse>(
      `https://api.deezer.com/album/${match.id}/tracks?limit=100`
    ),
  ]);

  const coverUrl = full.cover_xl || full.cover_medium || match.cover_xl || match.cover_medium;
  if (!coverUrl) return null;

  const tracks = mapDeezerTracks(tracksResponse.data ?? []);
  const genre = full.genres?.data?.find((item) => item.name?.trim())?.name;

  return {
    album: full.title || match.title,
    artist: full.artist?.name ?? match.artist?.name ?? query.artist,
    coverUrl,
    genre: genre?.trim() || undefined,
    releaseDate: full.release_date || undefined,
    label: full.label?.trim() || undefined,
    trackCount: full.nb_tracks ?? tracks.length,
    durationSec:
      typeof full.duration === "number" && full.duration > 0
        ? full.duration
        : undefined,
    tracks,
    source: "deezer",
  };
}

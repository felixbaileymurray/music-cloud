import { namesMatch } from "@/lib/normalize";
import { previewUrlPlayable } from "@/lib/preview-probe";
import type {
  AlbumArtist,
  AlbumDetails,
  AlbumTrack,
  ClipRef,
  PreviewMatch,
} from "@/lib/types";

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
  id: number;
  title?: string;
  preview?: string;
  rank?: number;
  duration?: number;
  track_position?: number;
};

type DeezerTracksResponse = {
  data?: DeezerTrack[];
};

type DeezerTrackLookup = {
  id?: number;
  preview?: string;
};

async function deezerJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Deezer HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function freshDeezerPreviewUrl(trackId: number) {
  const track = await deezerJson<DeezerTrackLookup>(
    `https://api.deezer.com/track/${trackId}`
  );
  const preview = track.preview?.trim();
  return preview || null;
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

export async function lookupDeezer(
  query: AlbumArtist
): Promise<PreviewMatch | null> {
  const album = await findDeezerAlbum(query);
  if (!album) return null;

  const tracks = await deezerJson<DeezerTracksResponse>(
    `https://api.deezer.com/album/${album.id}/tracks?limit=50`
  );
  const ranked = [...(tracks.data ?? [])]
    .filter((track) => Boolean(track.preview) && Number.isFinite(track.id))
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

  const clips: ClipRef[] = [];
  for (const track of ranked) {
    if (clips.length >= 3) break;
    // One live probe proves the album has audio; later plays refresh Deezer tokens.
    if (clips.length === 0) {
      const ok = await previewUrlPlayable(track.preview!);
      if (!ok) continue;
    }
    clips.push({ kind: "deezer", trackId: track.id });
  }

  const coverUrl = album.cover_xl || album.cover_medium;
  if (!coverUrl || clips.length === 0) return null;

  return {
    coverUrl,
    clips,
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
      deezerTrackId: Number.isFinite(track.id) ? track.id : undefined,
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

  const coverUrl =
    full.cover_xl || full.cover_medium || match.cover_xl || match.cover_medium;
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

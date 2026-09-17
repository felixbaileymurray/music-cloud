import { namesMatch } from "@/lib/normalize";
import { previewUrlPlayable } from "@/lib/preview-probe";
import type { AlbumArtist, ClipRef, PreviewMatch } from "@/lib/types";

type DeezerAlbum = {
  id: number;
  title: string;
  cover_xl?: string;
  cover_medium?: string;
  artist?: { name?: string };
};

type DeezerSearchResponse = {
  data?: DeezerAlbum[];
};

type DeezerTrack = {
  id: number;
  preview?: string;
  rank?: number;
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

export async function lookupDeezer(
  query: AlbumArtist
): Promise<PreviewMatch | null> {
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

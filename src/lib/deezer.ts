import { namesMatch } from "@/lib/normalize";
import type { AlbumArtist } from "@/lib/types";

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
  preview?: string;
  rank?: number;
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

export async function lookupDeezer(query: AlbumArtist) {
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

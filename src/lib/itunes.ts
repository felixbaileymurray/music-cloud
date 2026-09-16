import { namesMatch } from "@/lib/normalize";
import type { AlbumArtist } from "@/lib/types";

type ItunesAlbum = {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
};

type ItunesTrack = {
  wrapperType?: string;
  previewUrl?: string;
  trackName?: string;
};

type ItunesSearchResponse = {
  results?: ItunesAlbum[];
};

type ItunesLookupResponse = {
  results?: Array<ItunesAlbum | ItunesTrack>;
};

const UA = "MusicCloud/0.1 (album cover cloud preview lookup)";

export function itunesArtwork(url: string | undefined) {
  if (!url) return null;
  return url.replace(/100x100bb/g, "600x600bb").replace(/100x100/g, "600x600");
}

async function itunesJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`iTunes HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function lookupItunes(query: AlbumArtist) {
  const term = encodeURIComponent(`${query.album} ${query.artist}`);
  const search = await itunesJson<ItunesSearchResponse>(
    `https://itunes.apple.com/search?term=${term}&entity=album&limit=5`
  );
  const album = (search.results ?? []).find(
    (result) =>
      namesMatch(result.collectionName, query.album) &&
      namesMatch(result.artistName, query.artist)
  );
  if (!album) return null;

  const lookup = await itunesJson<ItunesLookupResponse>(
    `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200`
  );
  const previews = (lookup.results ?? [])
    .filter((item): item is ItunesTrack => "previewUrl" in item)
    .map((item) => item.previewUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 3);

  const coverUrl = itunesArtwork(album.artworkUrl100);
  if (!coverUrl || previews.length === 0) return null;

  return {
    coverUrl,
    previews,
    album: album.collectionName,
    artist: album.artistName,
  };
}

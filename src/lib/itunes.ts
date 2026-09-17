import { namesMatch } from "@/lib/normalize";
import type { AlbumArtist, AlbumDetails, AlbumTrack } from "@/lib/types";

type ItunesAlbum = {
  wrapperType?: string;
  kind?: string;
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackCount?: number;
  copyright?: string;
};

type ItunesTrack = {
  wrapperType?: string;
  kind?: string;
  previewUrl?: string;
  trackName?: string;
  trackNumber?: number;
  trackTimeMillis?: number;
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

async function findItunesAlbum(query: AlbumArtist): Promise<ItunesAlbum | null> {
  const term = encodeURIComponent(`${query.album} ${query.artist}`);
  const search = await itunesJson<ItunesSearchResponse>(
    `https://itunes.apple.com/search?term=${term}&entity=album&limit=5`
  );
  const album = (search.results ?? []).find(
    (result) =>
      namesMatch(result.collectionName, query.album) &&
      namesMatch(result.artistName, query.artist)
  );
  return album ?? null;
}

function isItunesSong(item: ItunesAlbum | ItunesTrack): item is ItunesTrack {
  return (
    Boolean("trackName" in item && item.trackName) ||
    item.wrapperType === "track" ||
    item.kind === "song"
  );
}

function mapItunesTracks(items: Array<ItunesAlbum | ItunesTrack>): AlbumTrack[] {
  return items
    .filter(isItunesSong)
    .map((track) => ({
      title: track.trackName?.trim() || "Untitled",
      durationSec:
        typeof track.trackTimeMillis === "number" && track.trackTimeMillis > 0
          ? Math.round(track.trackTimeMillis / 1000)
          : undefined,
      position:
        typeof track.trackNumber === "number" ? track.trackNumber : undefined,
      previewUrl: track.previewUrl || undefined,
    }))
    .filter((track) => track.title.length > 0)
    .sort(
      (a, b) =>
        (a.position ?? Number.MAX_SAFE_INTEGER) -
        (b.position ?? Number.MAX_SAFE_INTEGER)
    );
}

export async function lookupItunes(query: AlbumArtist) {
  const album = await findItunesAlbum(query);
  if (!album) return null;

  const lookup = await itunesJson<ItunesLookupResponse>(
    `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200`
  );
  const previews = (lookup.results ?? [])
    .filter(isItunesSong)
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

export async function lookupItunesAlbumDetails(
  query: AlbumArtist
): Promise<AlbumDetails | null> {
  const album = await findItunesAlbum(query);
  if (!album) return null;

  const lookup = await itunesJson<ItunesLookupResponse>(
    `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200`
  );
  const results = lookup.results ?? [];
  const collection =
    results.find(
      (item): item is ItunesAlbum =>
        "collectionId" in item && !isItunesSong(item)
    ) ?? album;

  const coverUrl = itunesArtwork(collection.artworkUrl100 || album.artworkUrl100);
  if (!coverUrl) return null;

  const tracks = mapItunesTracks(results);
  const durationSec = tracks.reduce(
    (sum, track) => sum + (track.durationSec ?? 0),
    0
  );

  return {
    album: collection.collectionName || album.collectionName,
    artist: collection.artistName || album.artistName,
    coverUrl,
    genre: collection.primaryGenreName?.trim() || undefined,
    releaseDate: collection.releaseDate?.slice(0, 10) || undefined,
    label: collection.copyright?.trim() || undefined,
    trackCount: collection.trackCount ?? tracks.length,
    durationSec: durationSec > 0 ? durationSec : undefined,
    tracks,
    source: "itunes",
  };
}

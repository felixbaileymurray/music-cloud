import { namesMatch } from "@/lib/normalize";
import { previewUrlPlayable } from "@/lib/preview-probe";
import type {
  AlbumArtist,
  AlbumDetails,
  AlbumTrack,
  ClipRef,
  PreviewMatch,
  TrackDetails,
  TrackPreviewMatch,
  TrackQuery,
} from "@/lib/types";

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
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
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

export async function lookupItunes(
  query: AlbumArtist
): Promise<PreviewMatch | null> {
  const album = await findItunesAlbum(query);
  if (!album) return null;

  const lookup = await itunesJson<ItunesLookupResponse>(
    `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200`
  );
  const urls = (lookup.results ?? [])
    .filter(isItunesSong)
    .map((item) => item.previewUrl)
    .filter((url): url is string => Boolean(url));

  const clips: ClipRef[] = [];
  for (const url of urls) {
    if (clips.length >= 3) break;
    if (clips.length === 0) {
      const ok = await previewUrlPlayable(url);
      if (!ok) continue;
    }
    clips.push({ kind: "itunes", url });
  }

  const coverUrl = itunesArtwork(album.artworkUrl100);
  if (!coverUrl || clips.length === 0) return null;

  return {
    coverUrl,
    clips,
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

async function findItunesTrack(query: TrackQuery): Promise<ItunesTrack | null> {
  const term = encodeURIComponent(`${query.track} ${query.artist}`);
  const search = await itunesJson<{ results?: ItunesTrack[] }>(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=8`
  );
  const match = (search.results ?? []).find(
    (result) =>
      namesMatch(result.trackName ?? "", query.track) &&
      namesMatch(result.artistName ?? "", query.artist)
  );
  return match ?? null;
}

type ItunesTrackSearch = ItunesTrack & {
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
};

export async function lookupItunesTrack(
  query: TrackQuery
): Promise<TrackPreviewMatch | null> {
  const track = (await findItunesTrack(query)) as ItunesTrackSearch | null;
  if (!track?.previewUrl) return null;

  const ok = await previewUrlPlayable(track.previewUrl);
  if (!ok) return null;

  const coverUrl = itunesArtwork(track.artworkUrl100);
  if (!coverUrl) return null;

  return {
    coverUrl,
    track: track.trackName?.trim() || query.track,
    artist: track.artistName?.trim() || query.artist,
    album: track.collectionName?.trim() || query.album,
    clips: [{ kind: "itunes", url: track.previewUrl }],
  };
}

export async function lookupItunesTrackDetails(
  query: TrackQuery
): Promise<TrackDetails | null> {
  const track = (await findItunesTrack(query)) as ItunesTrackSearch | null;
  if (!track) return null;

  const coverUrl = itunesArtwork(track.artworkUrl100);
  if (!coverUrl) return null;

  return {
    track: track.trackName?.trim() || query.track,
    artist: track.artistName?.trim() || query.artist,
    album: track.collectionName?.trim() || query.album,
    coverUrl,
    durationSec:
      typeof track.trackTimeMillis === "number" && track.trackTimeMillis > 0
        ? Math.round(track.trackTimeMillis / 1000)
        : undefined,
    releaseDate: track.releaseDate?.slice(0, 10) || undefined,
    source: "itunes",
  };
}

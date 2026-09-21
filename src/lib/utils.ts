export { cn } from "cn";

/** Stable identity for signed CDN preview URLs (strip query / hash). */
export function previewUrlKey(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split(/[?#]/, 1)[0] ?? url;
  }
}

export function clipKey(clip: {
  kind: "deezer" | "itunes";
  trackId?: number;
  url?: string;
}) {
  if (clip.kind === "deezer" && typeof clip.trackId === "number") {
    return `deezer:${clip.trackId}`;
  }
  if (clip.kind === "itunes" && clip.url) {
    return `itunes:${previewUrlKey(clip.url)}`;
  }
  return null;
}

export type StreamingService = "spotify" | "appleMusic" | "youtubeMusic";

export type StreamingLink = {
  id: StreamingService;
  label: string;
  href: string;
};

/** Search deep-links for the major streaming services. */
export function streamingLinks(title: string, artist: string): StreamingLink[] {
  const query = `${artist} ${title}`.trim();
  const encoded = encodeURIComponent(query);
  return [
    {
      id: "spotify",
      label: "Spotify",
      href: `https://open.spotify.com/search/${encoded}`,
    },
    {
      id: "appleMusic",
      label: "Apple Music",
      href: `https://music.apple.com/search?term=${encoded}`,
    },
    {
      id: "youtubeMusic",
      label: "YouTube Music",
      href: `https://music.youtube.com/search?q=${encoded}`,
    },
  ];
}

const GENRE_TOKEN_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "pink",
] as const;

export type GenreTokenColor = (typeof GENRE_TOKEN_COLORS)[number];

/**
 * Curated palette so co-occurring genres rarely share a color.
 * Keys are lowercase; lookup also tries compacted forms (e.g. hiphop).
 */
const GENRE_COLORS: Record<string, GenreTokenColor> = {
  // Rock family — often co-tagged
  rock: "red",
  alternative: "green",
  "alternative rock": "green",
  indie: "teal",
  "indie rock": "teal",
  metal: "purple",
  "heavy metal": "purple",
  punk: "orange",
  grunge: "cyan",
  // Pop / dance
  pop: "pink",
  dance: "yellow",
  electronic: "cyan",
  electronica: "cyan",
  house: "blue",
  techno: "purple",
  edm: "yellow",
  // Hip-hop / soul
  "hip hop": "orange",
  hiphop: "orange",
  rap: "red",
  "r&b": "pink",
  rnb: "pink",
  soul: "purple",
  funk: "yellow",
  // Jazz / roots
  jazz: "blue",
  blues: "teal",
  classical: "purple",
  folk: "green",
  country: "orange",
  americana: "yellow",
  // Other common
  soundtrack: "blue",
  latin: "red",
  reggae: "green",
  gospel: "yellow",
  world: "teal",
  ambient: "cyan",
  experimental: "purple",
  "singer/songwriter": "green",
  "singer-songwriter": "green",
};

function normalizeGenreKey(genre: string) {
  return genre
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

function hashGenreColor(key: string): GenreTokenColor {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return GENRE_TOKEN_COLORS[hash % GENRE_TOKEN_COLORS.length];
}

/** Persistent genre → color. Same genre always gets the same color. */
export function genreTokenColor(genre: string): GenreTokenColor {
  const key = normalizeGenreKey(genre);
  const compact = key.replace(/[\s-]+/g, "");
  return (
    GENRE_COLORS[key] ??
    GENRE_COLORS[compact] ??
    hashGenreColor(key)
  );
}

export { cn } from "cn";

/** Stable identity for signed CDN preview URLs (strip query / hash). */
export function previewUrlKey(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split(/[?#]/, 1)[0] ?? url;
  }
}

export type StreamingService = "spotify" | "appleMusic" | "youtubeMusic";

export type StreamingLink = {
  id: StreamingService;
  label: string;
  href: string;
};

/** Search deep-links for the major streaming services. */
export function streamingLinks(album: string, artist: string): StreamingLink[] {
  const query = `${artist} ${album}`.trim();
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

export const SPOTIFY_SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "user-read-private",
] as const;

export function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const cookieSecret = process.env.SPOTIFY_COOKIE_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !cookieSecret) {
    return null;
  }

  return { clientId, clientSecret, redirectUri, cookieSecret };
}

export function spotifyConfigured() {
  return getSpotifyConfig() !== null;
}

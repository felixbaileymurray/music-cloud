import { cookies } from "next/headers";
import { getSpotifyConfig } from "@/lib/spotify/config";
import {
  SPOTIFY_TOKEN_COOKIE,
  type SpotifyTokenPayload,
  cookieOptions,
  sealPayload,
  unsealPayload,
} from "@/lib/spotify/session";

export async function readSpotifyTokens(): Promise<SpotifyTokenPayload | null> {
  const config = getSpotifyConfig();
  if (!config) return null;
  const jar = await cookies();
  const sealed = jar.get(SPOTIFY_TOKEN_COOKIE)?.value;
  if (!sealed) return null;
  return unsealPayload<SpotifyTokenPayload>(sealed, config.cookieSecret);
}

async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokenPayload | null> {
  const config = getSpotifyConfig();
  if (!config) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString("base64")}`,
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };
}

export async function getValidSpotifyAccessToken(): Promise<string | null> {
  const tokens = await readSpotifyTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  if (!refreshed) return null;

  const config = getSpotifyConfig();
  if (!config) return null;

  const jar = await cookies();
  jar.set(
    SPOTIFY_TOKEN_COOKIE,
    sealPayload(refreshed, config.cookieSecret),
    cookieOptions(60 * 60 * 24 * 7)
  );

  return refreshed.accessToken;
}

export async function spotifyApiGet<T>(path: string): Promise<T> {
  const token = await getValidSpotifyAccessToken();
  if (!token) {
    throw new Error("not_authenticated");
  }

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(`spotify_http_${response.status}`);
  }

  return (await response.json()) as T;
}

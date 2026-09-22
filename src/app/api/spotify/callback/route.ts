import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSpotifyConfig } from "@/lib/spotify/config";
import {
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_OAUTH_STATE_COOKIE,
  SPOTIFY_TOKEN_COOKIE,
  type SpotifyTokenPayload,
  cookieOptions,
  sealPayload,
} from "@/lib/spotify/session";

/** Prefer Host / redirect URI origin — request.url is `0.0.0.0` when next binds there. */
function appOrigin(request: Request) {
  const url = new URL(request.url);
  const forwarded = request.headers.get("x-forwarded-host");
  const host = forwarded ?? request.headers.get("host");
  if (host && url.hostname === "0.0.0.0") {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (url.protocol === "https:" ? "https" : "http");
    return `${proto}://${host}`;
  }
  if (url.hostname === "0.0.0.0") {
    const config = getSpotifyConfig();
    if (config) {
      return new URL(config.redirectUri).origin;
    }
  }
  return `${url.protocol}//${url.host}`;
}

function errorRedirect(request: Request, reason: string) {
  return NextResponse.redirect(
    `${appOrigin(request)}/?spotify=error&reason=${reason}`
  );
}

export async function GET(request: Request) {
  const config = getSpotifyConfig();
  if (!config) {
    return errorRedirect(request, "config");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${appOrigin(request)}/?spotify=denied`);
  }

  const jar = await cookies();
  const expectedState = jar.get(SPOTIFY_OAUTH_STATE_COOKIE)?.value;
  const verifier = jar.get(SPOTIFY_CODE_VERIFIER_COOKIE)?.value;

  if (!expectedState || !verifier) {
    return errorRedirect(request, "cookies");
  }
  if (expectedState !== state) {
    return errorRedirect(request, "state");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  });

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
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

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => "");
    console.error(
      "[spotify/callback] token exchange failed",
      tokenResponse.status,
      detail
    );
    return errorRedirect(request, "token");
  }

  const data = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const payload: SpotifyTokenPayload = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };

  const redirect = NextResponse.redirect(
    `${appOrigin(request)}/?spotify=connected&create=1`
  );

  redirect.cookies.set(
    SPOTIFY_TOKEN_COOKIE,
    sealPayload(payload, config.cookieSecret),
    cookieOptions(60 * 60 * 24 * 7)
  );
  redirect.cookies.set(SPOTIFY_OAUTH_STATE_COOKIE, "", cookieOptions(0));
  redirect.cookies.set(SPOTIFY_CODE_VERIFIER_COOKIE, "", cookieOptions(0));

  return redirect;
}

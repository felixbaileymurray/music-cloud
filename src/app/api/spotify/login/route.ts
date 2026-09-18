import { NextResponse } from "next/server";
import { getSpotifyConfig, SPOTIFY_SCOPES } from "@/lib/spotify/config";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/spotify/pkce";
import {
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_OAUTH_STATE_COOKIE,
  cookieOptions,
} from "@/lib/spotify/session";

export async function GET(request: Request) {
  const config = getSpotifyConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Spotify is not configured on this server." },
      { status: 503 }
    );
  }

  // OAuth cookies are host-only. Spotify returns to redirect_uri's host, so
  // start the flow from that origin (e.g. 127.0.0.1, not localhost).
  const redirectOrigin = new URL(config.redirectUri).origin;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const requestUrl = new URL(request.url);
  const requestOrigin =
    host && requestUrl.hostname === "0.0.0.0"
      ? `${requestUrl.protocol}//${host}`
      : requestUrl.hostname === "0.0.0.0"
        ? redirectOrigin
        : requestUrl.origin;

  if (requestOrigin !== redirectOrigin) {
    return NextResponse.redirect(`${redirectOrigin}/api/spotify/login`);
  }

  const state = generateOAuthState();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );

  response.cookies.set(
    SPOTIFY_OAUTH_STATE_COOKIE,
    state,
    cookieOptions(60 * 10)
  );
  response.cookies.set(
    SPOTIFY_CODE_VERIFIER_COOKIE,
    verifier,
    cookieOptions(60 * 10)
  );

  return response;
}

import { NextResponse } from "next/server";
import { SPOTIFY_TOKEN_COOKIE, cookieOptions } from "@/lib/spotify/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SPOTIFY_TOKEN_COOKIE, "", cookieOptions(0));
  return response;
}

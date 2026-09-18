import { NextResponse } from "next/server";
import { spotifyApiGet } from "@/lib/spotify/client";
import { spotifyConfigured } from "@/lib/spotify/config";
import {
  fetchSpotifyTracks,
  type SpotifyTimeRange,
  type SpotifyTrackSource,
} from "@/lib/spotify/tracks";

export async function POST(request: Request) {
  if (!spotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const source = (body as { source?: unknown }).source;
  if (source !== "top" && source !== "recent" && source !== "saved") {
    return NextResponse.json(
      { error: 'Body source must be "top", "recent", or "saved".' },
      { status: 400 }
    );
  }

  let timeRange: SpotifyTimeRange = "medium_term";
  const rawRange = (body as { timeRange?: unknown }).timeRange;
  if (
    rawRange === "short_term" ||
    rawRange === "medium_term" ||
    rawRange === "long_term"
  ) {
    timeRange = rawRange;
  }

  try {
    const result = await fetchSpotifyTracks(
      source as SpotifyTrackSource,
      timeRange,
      spotifyApiGet
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "not_authenticated") {
      return NextResponse.json({ error: "Not connected to Spotify." }, { status: 401 });
    }
    return NextResponse.json({ error: "Spotify fetch failed." }, { status: 502 });
  }
}

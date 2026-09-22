import { NextResponse } from "next/server";
import { spotifyApiGet, readSpotifyTokens } from "@/lib/spotify/client";
import { spotifyConfigured } from "@/lib/spotify/config";

export async function GET() {
  if (!spotifyConfigured()) {
    return NextResponse.json({ connected: false, configured: false });
  }

  const tokens = await readSpotifyTokens();
  if (!tokens) {
    return NextResponse.json({ connected: false, configured: true });
  }

  try {
    const profile = await spotifyApiGet<{ display_name?: string }>("/me");
    return NextResponse.json({
      connected: true,
      configured: true,
      displayName: profile.display_name?.trim() || "Spotify user",
    });
  } catch {
    return NextResponse.json({ connected: false, configured: true });
  }
}

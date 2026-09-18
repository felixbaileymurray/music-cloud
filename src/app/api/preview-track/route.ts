import { NextResponse } from "next/server";
import { resolveTrackPreview } from "@/lib/resolve-track-preview";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { track?: unknown }).track !== "string" ||
    typeof (body as { artist?: unknown }).artist !== "string"
  ) {
    return NextResponse.json(
      { error: "Body must include track and artist strings." },
      { status: 400 }
    );
  }

  const track = (body as { track: string }).track;
  const artist = (body as { artist: string }).artist;
  const album =
    typeof (body as { album?: unknown }).album === "string"
      ? (body as { album: string }).album
      : undefined;

  try {
    const hit = await resolveTrackPreview({ track, artist, album });
    if (!hit) {
      return NextResponse.json({ error: "No preview match." }, { status: 404 });
    }
    return NextResponse.json(hit);
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { resolveAlbumDetails } from "@/lib/resolve-album";

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
    typeof (body as { album?: unknown }).album !== "string" ||
    typeof (body as { artist?: unknown }).artist !== "string"
  ) {
    return NextResponse.json(
      { error: "Body must include album and artist strings." },
      { status: 400 }
    );
  }

  const album = (body as { album: string }).album;
  const artist = (body as { artist: string }).artist;

  try {
    const details = await resolveAlbumDetails({ album, artist });
    if (!details) {
      return NextResponse.json({ error: "No album match." }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 502 });
  }
}

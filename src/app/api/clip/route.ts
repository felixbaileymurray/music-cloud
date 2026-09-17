import { freshDeezerPreviewUrl } from "@/lib/deezer";
import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "audio-ssl.itunes.apple.com",
  "audio.itunes.apple.com",
  "preview.itunes.apple.com",
  "dzcdn.net",
  "cdns-preview.dzcdn.net",
  "cdnt-preview.dzcdn.net",
];

function hostAllowed(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

async function streamPreview(target: URL, cacheControl: string) {
  if (target.protocol !== "https:" || !hostAllowed(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed." }, { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Clip fetch failed." },
      { status: upstream.status || 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const deezerTrack = params.get("deezer");
  if (deezerTrack) {
    const trackId = Number(deezerTrack);
    if (!Number.isFinite(trackId) || trackId <= 0) {
      return NextResponse.json({ error: "Invalid deezer id." }, { status: 400 });
    }
    try {
      const preview = await freshDeezerPreviewUrl(trackId);
      if (!preview) {
        return NextResponse.json({ error: "No Deezer preview." }, { status: 404 });
      }
      // Bytes are fine to reuse briefly; never pin the signed upstream URL.
      return streamPreview(new URL(preview), "private, max-age=120");
    } catch {
      return NextResponse.json({ error: "Deezer lookup failed." }, { status: 502 });
    }
  }

  const url = params.get("u");
  if (!url) {
    return NextResponse.json({ error: "Missing u or deezer." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

  return streamPreview(target, "public, max-age=86400");
}

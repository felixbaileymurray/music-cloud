import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "audio-ssl.itunes.apple.com",
  "audio.itunes.apple.com",
  "preview.itunes.apple.com",
  "dzcdn.net",
  "cdns-preview.dzcdn.net",
];

function hostAllowed(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("u");
  if (!url) {
    return NextResponse.json({ error: "Missing u." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

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
      "Cache-Control": "public, max-age=86400",
    },
  });
}

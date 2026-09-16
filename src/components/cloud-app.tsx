"use client";

import { useMemo, useState } from "react";
import { CoverCloud } from "@/components/cover-cloud";
import { HistoryIntake } from "@/components/history-intake";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cacheKey } from "@/lib/normalize";
import { idbGet, idbSet } from "@/lib/idb-cache";
import { unlockAudio } from "@/lib/snippet-player";
import type { AlbumListen, ParseResult, PreviewHit } from "@/lib/types";

type Phase = "intake" | "resolve" | "cloud" | "empty-match";

const DEFAULT_CLOUD = 40;

export function CloudApp() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [resolved, setResolved] = useState<PreviewHit[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, kept: 0 });
  const [cloudSize, setCloudSize] = useState(DEFAULT_CLOUD);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const visible = useMemo(
    () => resolved.slice(0, Math.max(1, Math.min(cloudSize, resolved.length))),
    [cloudSize, resolved]
  );

  async function startResolve(result: ParseResult) {
    setParsed(result);
    setPhase("resolve");
    setResolveError(null);
    setProgress({ done: 0, total: result.listens.length, kept: 0 });

    const kept: PreviewHit[] = [];
    let done = 0;
    let cursor = 0;
    const listens = result.listens;

    async function worker() {
      while (cursor < listens.length) {
        const index = cursor;
        cursor += 1;
        const listen = listens[index];
        const hit = await resolveOne(listen);
        done += 1;
        if (hit) kept.push(hit);
        setProgress({ done, total: listens.length, kept: kept.length });
      }
    }

    try {
      await Promise.all([worker(), worker()]);
      kept.sort((a, b) => b.listenCount - a.listenCount);
      setResolved(kept);
      if (kept.length === 0) {
        setPhase("empty-match");
        return;
      }
      setCloudSize(Math.min(DEFAULT_CLOUD, kept.length));
      setPhase("cloud");
    } catch {
      setResolveError("Lookup failed partway through. Try again in a moment.");
      setPhase("intake");
    }
  }

  async function enableAudio() {
    const ok = await unlockAudio();
    setAudioUnlocked(ok);
  }

  if (phase === "intake") {
    return (
      <div className="flex flex-1 flex-col">
        {resolveError ? (
          <p className="mx-auto mt-6 max-w-xl px-4 text-sm text-destructive">
            {resolveError}
          </p>
        ) : null}
        <HistoryIntake onParsed={(result) => void startResolve(result)} />
      </div>
    );
  }

  if (phase === "resolve" && parsed) {
    const pct = parsed.listens.length
      ? Math.round((progress.done / parsed.listens.length) * 100)
      : 0;
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4">
        <h1 className="font-heading text-2xl">Fetching covers and snippets</h1>
        <p className="text-sm text-muted-foreground">
          iTunes first, Deezer if there is no match. Albums without audio never
          enter the cloud.
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {progress.done} / {progress.total} looked up · {progress.kept} with
          audio
        </p>
      </div>
    );
  }

  if (phase === "empty-match") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4">
        <h1 className="font-heading text-2xl">No snippets matched</h1>
        <p className="text-sm text-muted-foreground">
          Every album was dropped. A tighter album + artist list matches more
          often. Nothing is shown without audio.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setParsed(null);
            setResolved([]);
            setPhase("intake");
          }}
        >
          Try another list
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="z-30 flex flex-col gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Music Cloud
          </p>
          <p className="text-sm text-muted-foreground">
            {visible.length} of {resolved.length} matched albums
            {parsed?.skippedRows
              ? ` · ${parsed.skippedRows} rows skipped (no album + artist)`
              : ""}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:max-w-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cloud size</span>
            <span>{visible.length}</span>
          </div>
          <Slider
            min={1}
            max={resolved.length}
            value={[Math.min(cloudSize, resolved.length)]}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              if (typeof next === "number") setCloudSize(next);
            }}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setParsed(null);
            setResolved([]);
            setPhase("intake");
          }}
        >
          New list
        </Button>
      </header>

      <div className="relative min-h-0 flex-1" onPointerDown={() => void enableAudio()}>
        {!audioUnlocked ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
            <p className="rounded-full border border-border bg-card/90 px-3 py-1 text-xs text-muted-foreground">
              Click or tap once to enable snippets
            </p>
          </div>
        ) : null}
        <CoverCloud albums={visible} audioUnlocked={audioUnlocked} />
      </div>
    </div>
  );
}

async function resolveOne(listen: AlbumListen): Promise<PreviewHit | null> {
  const key = cacheKey(listen.album, listen.artist);
  const cached = await idbGet(key);
  if (cached) {
    return { ...cached, listenCount: listen.listenCount };
  }

  const response = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ album: listen.album, artist: listen.artist }),
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("preview lookup failed");
  }

  const data = (await response.json()) as {
    coverUrl: string;
    previews: string[];
    album: string;
    artist: string;
  };
  await idbSet(key, data);
  return {
    album: listen.album,
    artist: listen.artist,
    listenCount: listen.listenCount,
    coverUrl: data.coverUrl,
    previews: data.previews,
  };
}

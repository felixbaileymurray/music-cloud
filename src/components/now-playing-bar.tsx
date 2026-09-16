"use client";

import Link from "next/link";
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, Volume2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlbumCover } from "@/components/album-cover";
import { usePlayer } from "@/components/player-provider";
import { formatTime } from "@/lib/format";

export function NowPlayingBar() {
  const {
    album,
    track,
    playing,
    currentTime,
    duration,
    volume,
    error,
    toggle,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayer();

  if (!track || !album) {
    return (
      <footer className="border-t border-white/10 bg-[oklch(0.18_0.02_55)] px-4 py-3 text-sm text-muted-foreground md:px-8">
        Choose an album. Playback stays on this bar so you can keep browsing.
      </footer>
    );
  }

  const knownDuration = duration || track.duration;
  const canSeek = knownDuration > 0;

  return (
    <footer className="border-t border-white/10 bg-[oklch(0.18_0.02_55)] px-3 py-3 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)] md:items-center">
        <Link
          href={`/album/${album.id}`}
          className="flex min-w-0 items-center gap-3"
        >
          <AlbumCover
            cover={album.cover}
            title=""
            className="size-12 shrink-0 rounded-md [&>div:last-child]:hidden"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{track.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {album.artist} — {album.title}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={prev} aria-label="Previous track">
              <SkipBackIcon />
            </Button>
            <Button
              size="icon"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="rounded-full"
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={next} aria-label="Next track">
              <SkipForwardIcon />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <Slider
              min={0}
              max={canSeek ? knownDuration : 1}
              step={0.1}
              value={[Math.min(currentTime, knownDuration || 0)]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                seek(typeof nextValue === "number" ? nextValue : 0);
              }}
              disabled={!canSeek}
              aria-label="Seek"
            />
            <span className="w-8">{formatTime(knownDuration)}</span>
          </div>
          {error ? (
            <p className="text-center text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Volume2Icon className="size-4 text-muted-foreground" />
          <Slider
            className="w-28"
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={(value) => {
              const nextValue = Array.isArray(value) ? value[0] : value;
              setVolume(typeof nextValue === "number" ? nextValue : 0);
            }}
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}

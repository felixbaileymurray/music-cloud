"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PauseIcon, PlayIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ImportDialog } from "@/components/import-dialog";
import { AlbumCover } from "@/components/album-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePlayer } from "@/components/player-provider";
import { getAlbum, getAlbumTracks, importedAlbumShell } from "@/lib/catalog";
import { formatAlbumLength, formatTime } from "@/lib/format";
import { listImports, recordsToTracks } from "@/lib/imports";
import type { Album, Track } from "@/lib/types";

export function AlbumView({ albumId }: { albumId: string }) {
  const { playAlbum, playTrack, track, playing, toggle } = usePlayer();
  const seeded = getAlbum(albumId);
  const [importedTracks, setImportedTracks] = useState<Track[] | null>(
    albumId === "imported" ? null : []
  );
  const urlsRef = useState(() => new Map<string, string>())[0];

  const refreshImports = useCallback(async () => {
    if (albumId !== "imported") return;
    const records = await listImports();
    for (const [id, url] of urlsRef) {
      if (!records.some((record) => record.id === id)) {
        URL.revokeObjectURL(url);
        urlsRef.delete(id);
      }
    }
    for (const record of records) {
      if (!urlsRef.has(record.id)) {
        urlsRef.set(record.id, URL.createObjectURL(record.blob));
      }
    }
    setImportedTracks(recordsToTracks(records, urlsRef));
  }, [albumId, urlsRef]);

  useEffect(() => {
    if (albumId !== "imported") return;
    let cancelled = false;
    listImports()
      .then((records) => {
        if (cancelled) return;
        for (const [id, url] of urlsRef) {
          if (!records.some((record) => record.id === id)) {
            URL.revokeObjectURL(url);
            urlsRef.delete(id);
          }
        }
        for (const record of records) {
          if (!urlsRef.has(record.id)) {
            urlsRef.set(record.id, URL.createObjectURL(record.blob));
          }
        }
        setImportedTracks(recordsToTracks(records, urlsRef));
      })
      .catch(() => {
        if (!cancelled) setImportedTracks([]);
      });
    return () => {
      cancelled = true;
      for (const url of urlsRef.values()) URL.revokeObjectURL(url);
    };
  }, [albumId, urlsRef]);

  const album: Album | undefined = useMemo(() => {
    if (seeded) return seeded;
    if (albumId === "imported") {
      return {
        ...importedAlbumShell,
        trackIds: (importedTracks ?? []).map((item) => item.id),
      };
    }
    return undefined;
  }, [albumId, seeded, importedTracks]);

  const tracks = useMemo(() => {
    if (!album) return [];
    if (album.id === "imported") return importedTracks ?? [];
    return getAlbumTracks(album);
  }, [album, importedTracks]);

  if (!album) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-heading text-2xl">That album is not on the shelf.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been renamed, or the link is stale.
          </p>
          <Button className="mt-6" render={<Link href="/" />}>
            Back to the library
          </Button>
        </main>
      </div>
    );
  }

  const loadingImported = albumId === "imported" && importedTracks === null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader
        actions={
          albumId === "imported" ? (
            <ImportDialog onImported={() => void refreshImports()} />
          ) : null
        }
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Library
        </Link>
        <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start">
          <AlbumCover
            cover={album.cover}
            title={album.title}
            className="mx-auto aspect-square w-full max-w-xs md:max-w-none"
          />
          <div>
            <p className="text-xs tracking-[0.22em] text-primary uppercase">
              {album.genre}
            </p>
            <h1 className="mt-2 font-heading text-4xl tracking-tight md:text-5xl">
              {album.title}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{album.artist}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">{album.year}</Badge>
              <Badge variant="secondary">
                {loadingImported
                  ? "Loading"
                  : `${tracks.length} tracks · ${formatAlbumLength(tracks)}`}
              </Badge>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
              {album.liner}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                onClick={() => playAlbum(album, tracks)}
                disabled={!tracks.length}
              >
                Play album
              </Button>
              {albumId !== "imported" ? (
                <Button variant="outline" render={<Link href="/" />}>
                  More albums
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {loadingImported ? (
          <p className="text-sm text-muted-foreground">Reading imported files…</p>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="font-heading text-xl">No tracks in this album yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Import audio from this computer and it will show up here.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-white/10 rounded-2xl border border-white/10">
            {tracks.map((item, index) => {
              const active = track?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (active) toggle();
                      else playTrack(album, tracks, item);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <span className="w-6 text-center text-xs tabular-nums text-muted-foreground">
                      {active && playing ? (
                        <PauseIcon className="mx-auto size-3.5 text-primary" />
                      ) : active ? (
                        <PlayIcon className="mx-auto size-3.5 text-primary" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate ${active ? "text-primary" : ""}`}
                      >
                        {item.title}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatTime(item.duration)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}

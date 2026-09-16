"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ImportDialog } from "@/components/import-dialog";
import { AlbumCover } from "@/components/album-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/components/player-provider";
import {
  albums,
  getAlbumTracks,
  importedAlbumShell,
  searchCatalog,
} from "@/lib/catalog";
import { formatAlbumLength } from "@/lib/format";
import {
  clearImports,
  listImports,
  recordsToTracks,
  type ImportedRecord,
} from "@/lib/imports";
import type { Album, Track } from "@/lib/types";

export function LibraryView() {
  const { playAlbum } = usePlayer();
  const [query, setQuery] = useState("");
  const [imports, setImports] = useState<ImportedRecord[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const urlsRef = useState(() => new Map<string, string>())[0];

  const refreshImports = useCallback(async () => {
    try {
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
      setImports(records);
      setImportError(null);
    } catch {
      setImportError("Imported files could not be read from this browser.");
      setImports([]);
    }
  }, [urlsRef]);

  useEffect(() => {
    void refreshImports();
    return () => {
      for (const url of urlsRef.values()) URL.revokeObjectURL(url);
    };
  }, [refreshImports, urlsRef]);

  const importedTracks: Track[] = useMemo(() => {
    if (!imports?.length) return [];
    return recordsToTracks(imports, urlsRef);
  }, [imports, urlsRef]);

  const importedAlbum: Album | null = importedTracks.length
    ? { ...importedAlbumShell, trackIds: importedTracks.map((track) => track.id) }
    : null;

  const visible = useMemo(() => {
    const seeded = searchCatalog(query);
    if (!importedAlbum) return seeded;
    const q = query.trim().toLowerCase();
    const matchesImport =
      !q ||
      importedAlbum.title.toLowerCase().includes(q) ||
      importedTracks.some((track) => track.title.toLowerCase().includes(q));
    return matchesImport ? [importedAlbum, ...seeded] : seeded;
  }, [query, importedAlbum, importedTracks]);

  const loadingImports = imports === null;

  async function handleClearImports() {
    await clearImports();
    for (const url of urlsRef.values()) URL.revokeObjectURL(url);
    urlsRef.clear();
    setImports([]);
    toast.success("Cleared imported tracks.");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        actions={<ImportDialog onImported={() => void refreshImports()} />}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs tracking-[0.22em] text-primary uppercase">
            Listening library
          </p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight text-balance md:text-5xl">
            Albums first. The rest of the room can wait.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Six records on the shelf, plus anything you import. Open an album,
            play it through, or queue a single track. The player stays put.
          </p>
        </div>

        {importError ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {importError}
          </p>
        ) : null}

        {loadingImports ? (
          <p className="text-sm text-muted-foreground">Opening your shelf…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="font-heading text-xl">Nothing matches that search.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try an artist, a year, or a track title — or clear the search to
              see the whole shelf.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((album) => {
              const tracks =
                album.id === "imported"
                  ? importedTracks
                  : getAlbumTracks(album);
              return (
                <li key={album.id} className="group">
                  <Link href={`/album/${album.id}`} className="block">
                    <AlbumCover
                      cover={album.cover}
                      title={album.title}
                      className="aspect-square transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.7)]"
                    />
                    <div className="mt-3">
                      <h2 className="truncate font-heading text-base">{album.title}</h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {album.artist}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">{album.year}</Badge>
                        <Badge variant="secondary">{album.genre}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {tracks.length} tracks · {formatAlbumLength(tracks)}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 px-0 text-primary"
                    onClick={() => playAlbum(album, tracks)}
                  >
                    Play album
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {importedAlbum ? (
          <div className="mt-10 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {importedTracks.length} imported{" "}
              {importedTracks.length === 1 ? "track" : "tracks"} live in this
              browser.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void handleClearImports()}>
              Clear imports
            </Button>
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">
            The seeded shelf is {albums.length} albums. Import your own files
            when you want the eighth.
          </p>
        )}
      </main>
    </div>
  );
}

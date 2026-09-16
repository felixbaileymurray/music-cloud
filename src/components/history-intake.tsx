"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { mergeParses, parseHistoryText } from "@/lib/parse-history";
import type { ParseResult } from "@/lib/types";

export function HistoryIntake({
  onParsed,
}: {
  onParsed: (result: ParseResult) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function readFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const parsed = await Promise.all(
        files.map(async (file) => parseHistoryText(await file.text(), file.name))
      );
      const merged = mergeParses(parsed);
      if (merged.listens.length === 0) {
        setError(
          merged.issues[0]?.detail ??
            "No album + artist rows found. Use a Spotify export, CSV, or Album - Artist lines."
        );
        return;
      }
      onParsed(merged);
    } catch {
      setError("Could not read those files.");
    } finally {
      setBusy(false);
    }
  }

  function submitPaste() {
    const parsed = parseHistoryText(text, "pasted list");
    if (parsed.listens.length === 0) {
      setError(
        parsed.issues[0]?.detail ??
          "Paste JSON, CSV with album and artist columns, or Album - Artist lines."
      );
      return;
    }
    setError(null);
    onParsed(parsed);
  }

  async function loadExample() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/example-history.csv");
      if (!response.ok) throw new Error("missing example");
      const parsed = parseHistoryText(await response.text(), "example-history.csv");
      onParsed(parsed);
    } catch {
      setError("Example list failed to load.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Music Cloud
        </p>
        <h1 className="font-heading text-3xl text-balance md:text-4xl">
          Cover art cloud from a listening history.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground md:text-base">
          Drop a list of albums and artists. Matches get a cover and a 30-second
          snippet. Hover plays; unmatched albums are dropped before the cloud
          appears.
        </p>
      </div>

      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) void readFiles(event.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.txt,application/json,text/csv,text/plain"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void readFiles(event.target.files);
          }}
        />
        <span className="text-sm font-medium">Drop Spotify JSON, CSV, or text</span>
        <span className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Spotify extended streaming history works. CSV needs album and artist
          columns. Text is one <code>Album - Artist</code> line each.
        </span>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Choose files
        </Button>
      </label>

      <div className="space-y-2">
        <label htmlFor="paste" className="text-sm font-medium">
          Or paste a list
        </label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={'OK Computer - Radiohead\nBlue Train - John Coltrane'}
          className="min-h-32 w-full rounded-xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy || !text.trim()} onClick={submitPaste}>
            Build from paste
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void loadExample()}>
            Use example list
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

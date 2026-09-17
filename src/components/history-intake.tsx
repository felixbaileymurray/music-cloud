"use client";

import { useRef, useState } from "react";
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
    <div className="history-intake">
      <div className="history-intake__intro">
        <p className="history-intake__eyebrow">Music Cloud</p>
        <p className="history-intake__lede">
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
        className="history-intake__drop"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.txt,application/json,text/csv,text/plain"
          multiple
          className="history-intake__sr-only"
          onChange={(event) => {
            if (event.target.files) void readFiles(event.target.files);
          }}
        />
        <span className="history-intake__drop-title">
          Drop Spotify JSON, CSV, or text
        </span>
        <span className="history-intake__drop-hint">
          Spotify extended streaming history works. CSV needs album and artist
          columns. Text is one <code>Album - Artist</code> line each.
        </span>
        <button
          type="button"
          className="spa-button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Choose files
        </button>
      </label>

      <div className="history-intake__paste">
        <label htmlFor="paste" className="history-intake__label">
          Or paste a list
        </label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"OK Computer - Radiohead\nBlue Train - John Coltrane"}
          className="history-intake__textarea"
        />
        <div className="history-intake__actions">
          <button
            type="button"
            className="spa-button spa-button--accent"
            disabled={busy || !text.trim()}
            onClick={submitPaste}
          >
            Build from paste
          </button>
          <button
            type="button"
            className="spa-button spa-button--ghost"
            disabled={busy}
            onClick={() => void loadExample()}
          >
            Use example list
          </button>
        </div>
      </div>

      {error ? <p className="spa-error">{error}</p> : null}
    </div>
  );
}

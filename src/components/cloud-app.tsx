"use client";

import { useMemo, useState } from "react";
import { CoverCloud } from "@/components/cover-cloud";
import { HistoryIntake } from "@/components/history-intake";
import { UploadModal } from "@/components/upload-modal";
import { Slider } from "@/components/ui/slider";
import { cacheKey } from "@/lib/normalize";
import { idbGet, idbSet } from "@/lib/idb-cache";
import { unlockAudio } from "@/lib/snippet-player";
import type { AlbumListen, ParseResult, PreviewHit } from "@/lib/types";
import "@/components/spa.css";

type Phase = "idle" | "resolve" | "cloud" | "empty-match";

const DEFAULT_CLOUD = 40;

export function CloudApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadOpen, setUploadOpen] = useState(true);
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

  const canDismissUpload = phase === "cloud" || phase === "empty-match";

  async function startResolve(result: ParseResult) {
    setParsed(result);
    setUploadOpen(false);
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
      setPhase("idle");
      setUploadOpen(true);
    }
  }

  async function enableAudio() {
    const ok = await unlockAudio();
    setAudioUnlocked(ok);
  }

  function openUpload() {
    setResolveError(null);
    setUploadOpen(true);
  }

  function closeUpload() {
    if (!canDismissUpload) return;
    setUploadOpen(false);
  }

  return (
    <div className="spa-shell">
      <aside className="spa-panel" aria-label="Cloud controls">
        <div className="spa-panel__meta">
          <p className="spa-panel__brand">Music Cloud</p>
          <p className="spa-panel__status">
            {phase === "cloud"
              ? `${visible.length} of ${resolved.length} matched albums${
                  parsed?.skippedRows
                    ? ` · ${parsed.skippedRows} rows skipped (no album + artist)`
                    : ""
                }`
              : phase === "resolve"
                ? "Looking up covers and snippets…"
                : phase === "empty-match"
                  ? "No snippets matched"
                  : "Upload a listening history to build the cloud"}
          </p>
        </div>

        {phase === "cloud" ? (
          <div className="spa-panel__controls">
            <div className="spa-panel__controls-row">
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
        ) : null}

        <div className="spa-panel__actions">
          {(phase === "cloud" || phase === "empty-match") && !uploadOpen ? (
            <button type="button" className="spa-button spa-button--accent" onClick={openUpload}>
              Upload list
            </button>
          ) : null}
        </div>
      </aside>

      <div className="spa-main">
        {resolveError && !uploadOpen ? (
          <div className="spa-status">
            <p className="spa-error">{resolveError}</p>
            <button type="button" className="spa-button spa-button--accent" onClick={openUpload}>
              Try again
            </button>
          </div>
        ) : null}

        {phase === "idle" && !resolveError ? (
          <div className="spa-empty">
            <h1 className="spa-empty__title">Cover art cloud</h1>
            <p className="spa-empty__body">
              Open upload to drop a Spotify export, CSV, or pasted album list.
              Matched albums appear here with hover snippets.
            </p>
            {!uploadOpen ? (
              <button type="button" className="spa-button spa-button--accent" onClick={openUpload}>
                Upload list
              </button>
            ) : null}
          </div>
        ) : null}

        {phase === "resolve" && parsed ? (
          <div className="spa-status">
            <h1 className="spa-status__title">Fetching covers and snippets</h1>
            <p className="spa-status__body">
              iTunes first, Deezer if there is no match. Albums without audio never
              enter the cloud.
            </p>
            <div
              className="spa-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                parsed.listens.length
                  ? Math.round((progress.done / parsed.listens.length) * 100)
                  : 0
              }
            >
              <div
                className="spa-progress__bar"
                style={{
                  width: `${
                    parsed.listens.length
                      ? Math.round((progress.done / parsed.listens.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="spa-status__body">
              {progress.done} / {progress.total} looked up · {progress.kept} with
              audio
            </p>
          </div>
        ) : null}

        {phase === "empty-match" ? (
          <div className="spa-status">
            <h1 className="spa-status__title">No snippets matched</h1>
            <p className="spa-status__body">
              Every album was dropped. A tighter album + artist list matches more
              often. Nothing is shown without audio.
            </p>
            {!uploadOpen ? (
              <button type="button" className="spa-button" onClick={openUpload}>
                Try another list
              </button>
            ) : null}
          </div>
        ) : null}

        {phase === "cloud" ? (
          <div className="spa-cloud-stage" onPointerDown={() => void enableAudio()}>
            {!audioUnlocked ? (
              <div className="spa-hint">
                <p className="spa-hint__text">Click or tap once to enable snippets</p>
              </div>
            ) : null}
            <CoverCloud albums={visible} audioUnlocked={audioUnlocked} />
          </div>
        ) : null}
      </div>

      <UploadModal
        open={uploadOpen}
        dismissible={canDismissUpload}
        onClose={closeUpload}
        title="Upload listening history"
      >
        <HistoryIntake onParsed={(result) => void startResolve(result)} />
      </UploadModal>
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

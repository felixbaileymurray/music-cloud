"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Slider } from "@astryxdesign/core/Slider";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  CoverCloud,
  DEFAULT_CLOUD_PHYSICS,
  type CloudPhysics,
} from "@/components/cover-cloud";
import { HistoryIntake } from "@/components/history-intake";
import { UploadModal } from "@/components/upload-modal";
import { cacheKey } from "@/lib/normalize";
import { idbGet, idbSet } from "@/lib/idb-cache";
import { unlockAudio } from "@/lib/snippet-player";
import type { AlbumListen, ParseResult, PreviewHit } from "@/lib/types";
import "@/components/spa.css";

type Phase = "idle" | "resolve" | "cloud" | "empty-match";

const DEFAULT_CLOUD = 40;
const DEFAULT_SIZE_RATIO = 4;
const MIN_SIZE_RATIO = 1;
const MAX_SIZE_RATIO = 6;
const DEFAULT_COLLISION_PAD = 10;
const DEFAULT_COVER_FRAME = 5;

export function CloudApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [resolved, setResolved] = useState<PreviewHit[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, kept: 0 });
  const [cloudSize, setCloudSize] = useState(DEFAULT_CLOUD);
  const [sizeRatio, setSizeRatio] = useState(DEFAULT_SIZE_RATIO);
  const [collisionPad, setCollisionPad] = useState(DEFAULT_COLLISION_PAD);
  const [coverFrame, setCoverFrame] = useState(DEFAULT_COVER_FRAME);
  const [centerStrengthBase, setCenterStrengthBase] = useState(
    DEFAULT_CLOUD_PHYSICS.centerStrengthBase
  );
  const [centerStrengthMass, setCenterStrengthMass] = useState(
    DEFAULT_CLOUD_PHYSICS.centerStrengthMass
  );
  const [chargeStrength, setChargeStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.chargeStrength
  );
  const [alphaDecay, setAlphaDecay] = useState(DEFAULT_CLOUD_PHYSICS.alphaDecay);
  const [collideIterations, setCollideIterations] = useState(
    DEFAULT_CLOUD_PHYSICS.collideIterations
  );
  const [boundaryStrength, setBoundaryStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.boundaryStrength
  );
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const visible = useMemo(
    () => resolved.slice(0, Math.max(1, Math.min(cloudSize, resolved.length))),
    [cloudSize, resolved]
  );

  const physics = useMemo<CloudPhysics>(
    () => ({
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      boundaryStrength,
    }),
    [
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      boundaryStrength,
    ]
  );

  const canDismissUpload = phase !== "resolve";
  const hasCloud = phase === "cloud";
  const progressPercent = parsed?.listens.length
    ? Math.round((progress.done / parsed.listens.length) * 100)
    : 0;

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

  function openCreate() {
    setResolveError(null);
    setUploadOpen(true);
  }

  function closeUpload() {
    if (!canDismissUpload) return;
    setUploadOpen(false);
  }

  const statusCopy =
    phase === "cloud"
      ? `${visible.length} of ${resolved.length} matched albums${
          parsed?.skippedRows
            ? ` · ${parsed.skippedRows} rows skipped (no album + artist)`
            : ""
        }`
      : phase === "resolve"
        ? "Looking up covers and snippets…"
        : phase === "empty-match"
          ? "No snippets matched"
          : "Create a cloud from your listening history";

  return (
    <div
      className="spa-shell"
      style={
        {
          "--cover-frame": `${coverFrame}px`,
        } as CSSProperties
      }
    >
      <aside className="spa-panel" aria-label="Cloud controls">
        <VStack gap={1}>
          <Text type="supporting">Music Cloud</Text>
          <Text type="body" color="secondary">
            {statusCopy}
          </Text>
        </VStack>

        {phase === "cloud" ? (
          <VStack gap={4} width="100%">
            <Slider
              label="Cloud size"
              min={1}
              max={resolved.length}
              step={1}
              value={Math.min(cloudSize, resolved.length)}
              onChange={setCloudSize}
              formatValue={(value) => `${value}`}
              valueDisplay="text"
              width="100%"
            />

            <Collapsible trigger="Customise" defaultIsOpen={false}>
              <VStack gap={3} width="100%" paddingBlockStart={3}>
                <Knob
                  label="Size ratio"
                  display={`${sizeRatio.toFixed(1)}×`}
                  min={MIN_SIZE_RATIO}
                  max={MAX_SIZE_RATIO}
                  step={0.1}
                  value={sizeRatio}
                  onChange={setSizeRatio}
                />
                <Knob
                  label="Collision pad"
                  display={`${collisionPad}px`}
                  min={0}
                  max={24}
                  step={1}
                  value={collisionPad}
                  onChange={setCollisionPad}
                />
                <Knob
                  label="Frame width"
                  display={`${coverFrame}px`}
                  min={0}
                  max={8}
                  step={1}
                  value={coverFrame}
                  onChange={setCoverFrame}
                />
                <Knob
                  label="Centre pull"
                  display={centerStrengthBase.toFixed(3)}
                  min={0}
                  max={0.12}
                  step={0.002}
                  value={centerStrengthBase}
                  onChange={setCenterStrengthBase}
                />
                <Knob
                  label="Mass pull"
                  display={centerStrengthMass.toFixed(3)}
                  min={0}
                  max={0.4}
                  step={0.005}
                  value={centerStrengthMass}
                  onChange={setCenterStrengthMass}
                />
                <Knob
                  label="Charge"
                  display={chargeStrength.toFixed(0)}
                  min={-40}
                  max={0}
                  step={1}
                  value={chargeStrength}
                  onChange={setChargeStrength}
                />
                <Knob
                  label="Settle speed"
                  display={alphaDecay.toFixed(3)}
                  min={0.005}
                  max={0.1}
                  step={0.001}
                  value={alphaDecay}
                  onChange={setAlphaDecay}
                />
                <Knob
                  label="Collide passes"
                  display={`${collideIterations}`}
                  min={1}
                  max={8}
                  step={1}
                  value={collideIterations}
                  onChange={setCollideIterations}
                />
                <Knob
                  label="Boundary"
                  display={boundaryStrength.toFixed(2)}
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={boundaryStrength}
                  onChange={setBoundaryStrength}
                />
              </VStack>
            </Collapsible>
          </VStack>
        ) : null}

        <div className="spa-panel__actions">
          <Button
            label="Create"
            variant="primary"
            onClick={openCreate}
            width="100%"
          />
          <Button label="Share" isDisabled={!hasCloud} width="100%" />
          <Button label="Save" isDisabled={!hasCloud} width="100%" />
        </div>
      </aside>

      <div className="spa-main">
        {resolveError && !uploadOpen ? (
          <div className="spa-status">
            <Banner
              status="error"
              title={resolveError}
              collapsible={false}
              endContent={
                <Button
                  label="Try again"
                  variant="primary"
                  onClick={openCreate}
                />
              }
            />
          </div>
        ) : null}

        {phase === "idle" && !resolveError ? (
          <div className="spa-empty">
            <EmptyState
              title="Cover art cloud"
              description="Create a cloud from a Spotify export, CSV, or pasted album list. Matched albums appear here with hover snippets."
              headingLevel={1}
              actions={
                !uploadOpen ? (
                  <Button
                    label="Create"
                    variant="primary"
                    onClick={openCreate}
                  />
                ) : undefined
              }
            />
          </div>
        ) : null}

        {phase === "resolve" && parsed ? (
          <div className="spa-status">
            <VStack gap={4} width="100%">
              <Heading level={1}>Fetching covers and snippets</Heading>
              <Text type="body" color="secondary">
                iTunes first, Deezer if there is no match. Albums without audio
                never enter the cloud.
              </Text>
              <ProgressBar
                label="Lookup progress"
                value={progressPercent}
                max={100}
                hasValueLabel
                formatValueLabel={() =>
                  `${progress.done} / ${progress.total} looked up · ${progress.kept} with audio`
                }
              />
            </VStack>
          </div>
        ) : null}

        {phase === "empty-match" ? (
          <div className="spa-empty">
            <EmptyState
              title="No snippets matched"
              description="Every album was dropped. A tighter album + artist list matches more often. Nothing is shown without audio."
              headingLevel={1}
              actions={
                !uploadOpen ? (
                  <Button label="Try another list" onClick={openCreate} />
                ) : undefined
              }
            />
          </div>
        ) : null}

        {phase === "cloud" ? (
          <div
            className="spa-cloud-stage"
            onPointerDown={() => void enableAudio()}
          >
            {!audioUnlocked ? (
              <div className="spa-hint">
                <Text type="supporting">Click or tap once to enable snippets</Text>
              </div>
            ) : null}
            <CoverCloud
              albums={visible}
              audioUnlocked={audioUnlocked}
              sizeRatio={sizeRatio}
              collisionPad={collisionPad}
              physics={physics}
            />
          </div>
        ) : null}
      </div>

      <UploadModal
        open={uploadOpen}
        dismissible={canDismissUpload}
        onClose={closeUpload}
        title="Create cloud"
      >
        <HistoryIntake onParsed={(result) => void startResolve(result)} />
      </UploadModal>
    </div>
  );
}

function Knob({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      formatValue={() => display}
      valueDisplay="text"
      width="100%"
    />
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

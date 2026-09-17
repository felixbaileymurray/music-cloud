"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Slider } from "@astryxdesign/core/Slider";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { AlbumInfoCard } from "@/components/album-info-card";
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
import type {
  AlbumDetails,
  AlbumListen,
  ClipRef,
  ParseResult,
  PreviewHit,
} from "@/lib/types";
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
  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
    found: 0,
    dropped: 0,
  });
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
  const [hovered, setHovered] = useState<PreviewHit | null>(null);
  const [locked, setLocked] = useState<PreviewHit | null>(null);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{
    album: string;
    artist: string;
    clip: ClipRef;
  } | null>(null);
  const [exploreResetToken, setExploreResetToken] = useState(0);
  const albumDetailsCacheRef = useRef(new Map<string, AlbumDetails>());

  const focused = locked ?? hovered;

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

  useEffect(() => {
    if (!focused) {
      setAlbumDetails(null);
      setAlbumError(null);
      setAlbumLoading(false);
      return;
    }

    const album = focused.album;
    const artist = focused.artist;
    const key = cacheKey(album, artist);
    const cached = albumDetailsCacheRef.current.get(key);
    if (cached) {
      setAlbumDetails(cached);
      setAlbumError(null);
      setAlbumLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      setAlbumLoading(true);
      setAlbumError(null);
      try {
        const response = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ album, artist }),
        });
        if (cancelled) return;
        if (response.status === 404) {
          setAlbumDetails(null);
          setAlbumError("No album details found for this cover.");
          return;
        }
        if (!response.ok) {
          setAlbumDetails(null);
          setAlbumError("Could not load album details. Try again.");
          return;
        }
        const data = (await response.json()) as AlbumDetails;
        albumDetailsCacheRef.current.set(key, data);
        if (!cancelled) setAlbumDetails(data);
      } catch {
        if (!cancelled) {
          setAlbumDetails(null);
          setAlbumError("Could not load album details. Try again.");
        }
      } finally {
        if (!cancelled) setAlbumLoading(false);
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [focused]);

  function lockAlbum(album: PreviewHit) {
    setLocked((current) => {
      if (
        current &&
        current.album === album.album &&
        current.artist === album.artist
      ) {
        return null;
      }
      return album;
    });
  }

  function resetExplore() {
    setLocked(null);
    setHovered(null);
    setHoverPreview(null);
    setExploreResetToken((token) => token + 1);
  }

  function onCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    void enableAudio();
    if (!locked) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".cover-cloud__node")) {
      return;
    }
    resetExplore();
  }

  async function startResolve(result: ParseResult) {
    setParsed(result);
    setUploadOpen(false);
    setPhase("resolve");
    setResolveError(null);
    setHovered(null);
    setLocked(null);
    setHoverPreview(null);
    setProgress({
      done: 0,
      total: result.listens.length,
      found: 0,
      dropped: 0,
    });

    const kept: PreviewHit[] = [];
    let done = 0;
    let found = 0;
    let dropped = 0;
    let cursor = 0;
    const listens = result.listens;

    async function worker() {
      while (cursor < listens.length) {
        const index = cursor;
        cursor += 1;
        const listen = listens[index];
        const hit = await resolveOne(listen);
        done += 1;
        if (hit) {
          kept.push(hit);
          found += 1;
        } else {
          dropped += 1;
        }
        setProgress({ done, total: listens.length, found, dropped });
      }
    }

    try {
      await Promise.all([worker(), worker()]);
      kept.sort((a, b) => b.listenCount - a.listenCount);
      setResolved(kept);
      setProgress({
        done: listens.length,
        total: listens.length,
        found: kept.length,
        dropped: listens.length - kept.length,
      });
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

  const focusedClip =
    focused &&
    hoverPreview &&
    focused.album === hoverPreview.album &&
    focused.artist === hoverPreview.artist
      ? hoverPreview.clip
      : null;

  const resolveStats = `${progress.total} processed · ${progress.found} found · ${progress.dropped} dropped`;
  const statusCopy =
    phase === "cloud"
      ? `${visible.length} showing · ${resolveStats}${
          parsed?.skippedRows
            ? ` · ${parsed.skippedRows} rows skipped (no album + artist)`
            : ""
        }`
      : phase === "resolve"
        ? "Looking up covers and snippets…"
        : phase === "empty-match"
          ? `No snippets matched · ${resolveStats}`
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
      <Layout
        height="fill"
        padding={0}
        end={
          <LayoutPanel
            width="var(--panel-width)"
            padding={0}
            isScrollable
            label="Cloud sidebar"
          >
            <VStack gap={4} width="100%" paddingBlock={0} hAlign="center">
              <Card width="100%" padding={4}>
                <VStack gap={4} width="100%">
                  <VStack gap={1} width="100%">
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

                  <VStack gap={2} width="100%">
                    <Button
                      label="Create"
                      variant="primary"
                      onClick={openCreate}
                      width="100%"
                    />
                    <Button label="Share" isDisabled={!hasCloud} width="100%" />
                    <Button label="Save" isDisabled={!hasCloud} width="100%" />
                  </VStack>
                </VStack>
              </Card>

              <Card width="100%" padding={4}>
                <AlbumInfoCard
                  details={albumDetails}
                  listenCount={focused?.listenCount}
                  isLoading={albumLoading}
                  error={albumError}
                  activeClip={focusedClip}
                  isLocked={locked != null}
                />
              </Card>
            </VStack>
          </LayoutPanel>
        }
      >
        <LayoutContent padding={0} isScrollable={false} label="Cloud canvas">
          <div className="spa-canvas">
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
                    Deezer first (top tracks by popularity), iTunes if there is no
                    match. Each preview is probed; albums without playable audio are
                    dropped before the cloud renders.
                  </Text>
                  <ProgressBar
                    label="Lookup progress"
                    value={progressPercent}
                    max={100}
                    hasValueLabel
                    formatValueLabel={() =>
                      `${progress.done} / ${progress.total} · ${progress.found} found · ${progress.dropped} dropped`
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
                onPointerDown={onCanvasPointerDown}
              >
                {!audioUnlocked ? (
                  <div className="spa-hint">
                    <Text type="supporting">
                      Click or tap once to enable snippets
                    </Text>
                  </div>
                ) : null}
                <CoverCloud
                  albums={visible}
                  audioUnlocked={audioUnlocked}
                  sizeRatio={sizeRatio}
                  collisionPad={collisionPad}
                  physics={physics}
                  lockedId={
                    locked ? `${locked.artist}::${locked.album}` : null
                  }
                  exploreResetToken={exploreResetToken}
                  onHoverChange={setHovered}
                  onLockToggle={lockAlbum}
                  onPreviewChange={setHoverPreview}
                />
              </div>
            ) : null}
          </div>
        </LayoutContent>
      </Layout>

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
    clips: PreviewHit["clips"];
    album: string;
    artist: string;
  };
  if (!Array.isArray(data.clips) || data.clips.length === 0) {
    return null;
  }
  const stored = {
    coverUrl: data.coverUrl,
    clips: data.clips,
    album: data.album,
    artist: data.artist,
  };
  await idbSet(key, stored);
  return {
    ...stored,
    album: listen.album,
    artist: listen.artist,
    listenCount: listen.listenCount,
  };
}

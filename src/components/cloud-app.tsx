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
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Slider } from "@astryxdesign/core/Slider";
import { StackItem } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  Download,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Share2,
} from "lucide-react";
import { AboutSection } from "@/components/about-section";
import { BrandWordmark } from "@/components/brand-wordmark";
import { CloudInfoPanel } from "@/components/cloud-info-panel";
import { CreateCloudFlow } from "@/components/create-cloud-flow";
import {
  CoverCloud,
  DEFAULT_CLOUD_PHYSICS,
  type CloudPhysics,
} from "@/components/cover-cloud";
import { SaveModal } from "@/components/save-modal";
import { ShareModal } from "@/components/share-modal";
import { UploadModal } from "@/components/upload-modal";
import {
  cloudNodeId,
  hitsMatchFocus,
  sameCloudHit,
  type HoverPreview,
} from "@/lib/cloud-node";
import { cacheKey } from "@/lib/normalize";
import { idbGet, idbSet } from "@/lib/idb-cache";
import {
  idbTrackGet,
  idbTrackSet,
  trackCacheKey,
} from "@/lib/idb-track-cache";
import {
  buildShareDocumentFromVisible,
  decodeShareHash,
  defaultCloudSize,
  recipientSourceLabel,
  SHARE_HASH_PREFIX,
  type ShareDocumentV1,
} from "@/lib/share-payload";
import { unlockAudio } from "@/lib/snippet-player";
import type {
  AlbumDetails,
  AlbumListen,
  CloudHit,
  CloudKind,
  ParseResult,
  PreviewHit,
  TrackDetails,
  TrackHit,
  TrackListen,
  TrackParseResult,
} from "@/lib/types";
import "@/components/spa.css";

type Phase = "idle" | "resolve" | "cloud" | "empty-match";

const DEFAULT_CLOUD = 50;
const DEFAULT_SIZE_RATIO = 4;
const MIN_SIZE_RATIO = 1;
const MAX_SIZE_RATIO = 6;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;
const DEFAULT_COLLISION_PAD = 10;
const DEFAULT_COVER_FRAME = 5;

export function CloudApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [exportNeutral, setExportNeutral] = useState(false);
  const cloudFrameRef = useRef<HTMLDivElement | null>(null);
  const [createModalTitle, setCreateModalTitle] = useState("Create Cloud");
  const [createFlowKey, setCreateFlowKey] = useState(0);
  const [createGate, setCreateGate] = useState<"warning" | "flow">("flow");
  const [replaceWarningReason, setReplaceWarningReason] = useState<
    "create" | "share"
  >("create");
  const [pendingShare, setPendingShare] = useState<ShareDocumentV1 | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [cloudKind, setCloudKind] = useState<CloudKind>("album");
  const [parsed, setParsed] = useState<ParseResult | TrackParseResult | null>(
    null
  );
  const [resolved, setResolved] = useState<CloudHit[]>([]);
  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
    found: 0,
    dropped: 0,
  });
  const [cloudSize, setCloudSize] = useState(DEFAULT_CLOUD);
  const [sizeRatio, setSizeRatio] = useState(DEFAULT_SIZE_RATIO);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
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
  const [collideStrength, setCollideStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.collideStrength
  );
  const [hoverReheat, setHoverReheat] = useState(
    DEFAULT_CLOUD_PHYSICS.hoverReheat
  );
  const [boundaryStrength, setBoundaryStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.boundaryStrength
  );
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<CloudHit | null>(null);
  const [locked, setLocked] = useState<CloudHit | null>(null);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [trackDetails, setTrackDetails] = useState<TrackDetails | null>(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [exploreResetToken, setExploreResetToken] = useState(0);
  const albumDetailsCacheRef = useRef(new Map<string, AlbumDetails>());
  const trackDetailsCacheRef = useRef(new Map<string, TrackDetails>());

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
      collideStrength,
      hoverReheat,
      boundaryStrength,
    }),
    [
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      collideStrength,
      hoverReheat,
      boundaryStrength,
    ]
  );

  const canDismissUpload = phase !== "resolve";
  const hasCloud = phase === "cloud";

  const shareDocument = useMemo(() => {
    if (!parsed || phase !== "cloud" || visible.length === 0) return null;
    return buildShareDocumentFromVisible(
      cloudKind,
      parsed.sourceLabel,
      visible
    );
  }, [cloudKind, parsed, phase, visible]);
  const progressPercent = parsed?.listens.length
    ? Math.round((progress.done / parsed.listens.length) * 100)
    : 0;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes(SHARE_HASH_PREFIX)) {
      void (async () => {
        try {
          const doc = await decodeShareHash(hash);
          window.history.replaceState(
            {},
            "",
            window.location.pathname + window.location.search
          );
          requestOpenShareDocument(doc);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Could not open share link.";
          setResolveError(message);
        }
      })();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const spotify = params.get("spotify");
    if (spotify === "connected" && params.get("create") === "1") {
      setCreateFlowKey((key) => key + 1);
      setCreateGate("flow");
      setUploadOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (spotify === "error" || spotify === "denied") {
      const reason = params.get("reason");
      const message =
        spotify === "denied"
          ? "You left Spotify without connecting. Choose Connect Spotify again when you're ready, or create a cloud another way."
          : reason === "cookies"
            ? "Your Spotify login expired before we could finish (this usually happens if the Spotify page was left open too long). Choose Connect Spotify again."
            : reason === "state"
              ? "That Spotify login didn't match this browser session (often from connecting in more than one tab). Choose Connect Spotify again."
              : reason === "token"
                ? "Spotify signed you in, but we couldn't finish the connection on our side. Create a cloud manually or try an example instead."
                : reason === "config"
                  ? "Spotify login isn't set up on this server. Create a cloud manually or try an example instead."
                  : "We couldn't connect to Spotify. Create a cloud manually or try an example instead.";
      setOauthError(message);
      setUploadOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!focused || cloudKind !== "album") {
      if (cloudKind !== "album") {
        setAlbumDetails(null);
        setAlbumError(null);
        setAlbumLoading(false);
      }
      if (!focused) {
        setAlbumDetails(null);
        setAlbumError(null);
        setAlbumLoading(false);
      }
      return;
    }

    const albumHit = focused as PreviewHit;
    const album = albumHit.album;
    const artist = albumHit.artist;
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
  }, [cloudKind, focused]);

  useEffect(() => {
    if (!focused || cloudKind !== "track") {
      if (cloudKind !== "track") {
        setTrackDetails(null);
        setTrackError(null);
        setTrackLoading(false);
      }
      if (!focused) {
        setTrackDetails(null);
        setTrackError(null);
        setTrackLoading(false);
      }
      return;
    }

    const trackHit = focused as TrackHit;
    const key = trackCacheKey(trackHit.track, trackHit.artist);
    const cached = trackDetailsCacheRef.current.get(key);
    if (cached) {
      setTrackDetails(cached);
      setTrackError(null);
      setTrackLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      setTrackLoading(true);
      setTrackError(null);
      try {
        const response = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track: trackHit.track,
            artist: trackHit.artist,
            album: trackHit.album,
          }),
        });
        if (cancelled) return;
        if (response.status === 404) {
          setTrackDetails(null);
          setTrackError("No track details found for this cover.");
          return;
        }
        if (!response.ok) {
          setTrackDetails(null);
          setTrackError("Could not load track details. Try again.");
          return;
        }
        const data = (await response.json()) as TrackDetails;
        trackDetailsCacheRef.current.set(key, data);
        if (!cancelled) setTrackDetails(data);
      } catch {
        if (!cancelled) {
          setTrackDetails(null);
          setTrackError("Could not load track details. Try again.");
        }
      } finally {
        if (!cancelled) setTrackLoading(false);
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [cloudKind, focused]);

  function lockCloud(hit: CloudHit) {
    setLocked((current) => {
      if (current && sameCloudHit(cloudKind, current, hit)) {
        return null;
      }
      return hit;
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

  async function startAlbumResolve(result: ParseResult) {
    setCloudKind("album");
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
        const hit = await resolveAlbumOne(listen);
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
      setCloudSize(defaultCloudSize(kept.length));
      setPhase("cloud");
    } catch {
      setResolveError("Lookup failed partway through. Try again in a moment.");
      setPhase("idle");
      setUploadOpen(true);
    }
  }

  async function startTrackResolve(
    listens: TrackListen[],
    sourceLabel: string
  ) {
    setCloudKind("track");
    setParsed({
      kind: "track",
      listens,
      skippedRows: 0,
      sourceLabel,
      issues: [],
    });
    setUploadOpen(false);
    setPhase("resolve");
    setResolveError(null);
    setHovered(null);
    setLocked(null);
    setHoverPreview(null);
    setProgress({
      done: 0,
      total: listens.length,
      found: 0,
      dropped: 0,
    });

    const kept: TrackHit[] = [];
    let done = 0;
    let found = 0;
    let dropped = 0;
    let cursor = 0;

    async function worker() {
      while (cursor < listens.length) {
        const index = cursor;
        cursor += 1;
        const listen = listens[index];
        const hit = await resolveTrackOne(listen);
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
      setCloudSize(defaultCloudSize(kept.length));
      setPhase("cloud");
    } catch {
      setResolveError("Lookup failed partway through. Try again in a moment.");
      setPhase("idle");
      setUploadOpen(true);
    }
  }

  function applyShareDocument(doc: ShareDocumentV1) {
    setShareOpen(false);
    setPendingShare(null);
    setReplaceWarningReason("create");
    const label = recipientSourceLabel(doc);
    if (doc.kind === "album") {
      void startAlbumResolve({
        kind: "album",
        listens: doc.listens as AlbumListen[],
        skippedRows: 0,
        sourceLabel: label,
        issues: [],
      });
      return;
    }
    void startTrackResolve(doc.listens as TrackListen[], label);
  }

  function requestOpenShareDocument(doc: ShareDocumentV1) {
    if (hasCloud) {
      setPendingShare(doc);
      setReplaceWarningReason("share");
      setCreateGate("warning");
      setCreateModalTitle("Do you want to replace your current collage?");
      setUploadOpen(true);
      return;
    }
    applyShareDocument(doc);
  }

  function openShare() {
    setShareOpen(true);
  }

  function closeShare() {
    setShareOpen(false);
  }

  function confirmReplaceWarning() {
    if (replaceWarningReason === "share" && pendingShare) {
      applyShareDocument(pendingShare);
      setUploadOpen(false);
      setCreateGate("flow");
      return;
    }
    beginCreateFlow();
  }

  async function enableAudio() {
    const ok = await unlockAudio();
    setAudioUnlocked(ok);
  }

  function beginCreateFlow() {
    setCreateFlowKey((key) => key + 1);
    setCreateGate("flow");
    setCreateModalTitle("Create collage");
  }

  function openCreate() {
    setResolveError(null);
    setOauthError(null);
    setCreateModalTitle("Create collage");
    setReplaceWarningReason("create");
    setPendingShare(null);
    if (hasCloud) {
      setCreateGate("warning");
    } else {
      beginCreateFlow();
    }
    setUploadOpen(true);
  }

  function closeUpload() {
    if (!canDismissUpload) return;
    setUploadOpen(false);
    setOauthError(null);
    setCreateGate("flow");
    setPendingShare(null);
    setReplaceWarningReason("create");
  }

  function openSave() {
    setSaveOpen(true);
  }

  function closeSave() {
    setSaveOpen(false);
    setExportNeutral(false);
  }

  async function prepareNeutralCapture() {
    setExportNeutral(true);
    setHovered(null);
    setHoverPreview(null);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    return () => setExportNeutral(false);
  }

  const focusedClip =
    focused && hitsMatchFocus(cloudKind, focused, hoverPreview)
      ? hoverPreview!.clip
      : null;

  const skippedLabel =
    parsed?.skippedRows && parsed.skippedRows > 0
      ? cloudKind === "track"
        ? `${parsed.skippedRows} rows skipped (no track + artist)`
        : `${parsed.skippedRows} rows skipped (no album + artist)`
      : null;

  const showResolveStatus =
    progress.total > 0 &&
    (phase === "resolve" || phase === "cloud" || phase === "empty-match");
  const isResolving = phase === "resolve";
  const cloudSizeMax = Math.max(1, resolved.length);

  const idleStatusCopy =
    "Create a collage of track or album covers from Spotify or a manual list";
  const emptyStatusCopy = "No snippets matched";

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
        start={
          <LayoutPanel
            width="var(--panel-width)"
            padding={0}
            isScrollable
            label="Cloud sidebar"
          >
            <Card width="100%" height="100%" padding={4}>
              <VStack gap={5} width="100%" height="100%">
                  <BrandWordmark />

                  <VStack gap={2} width="100%">
                    {hasCloud ? (
                      <>
                        <Button
                          label="Share"
                          variant="primary"
                          icon={<Icon icon={Share2} size="sm" />}
                          width="100%"
                          onClick={openShare}
                        />
                        <Grid columns={2} gap={2} width="100%">
                          <Button
                            label="Create"
                            variant="secondary"
                            icon={<Icon icon={Plus} size="sm" />}
                            onClick={openCreate}
                            width="100%"
                          />
                          <Button
                            label="Save"
                            variant="secondary"
                            icon={<Icon icon={Download} size="sm" />}
                            width="100%"
                            onClick={openSave}
                          />
                        </Grid>
                      </>
                    ) : (
                      <Button
                        label="Create"
                        variant="primary"
                        icon={<Icon icon={Plus} size="sm" />}
                        onClick={openCreate}
                        width="100%"
                      />
                    )}
                  </VStack>

                  {phase === "cloud" ? (
                    <Collapsible trigger="Customise" defaultIsOpen={false}>
                      <VStack gap={3} width="100%" paddingBlockStart={3}>
                        <Knob
                          label="Cloud size"
                          hint="How many covers are shown. Defaults to 50 when more are available."
                          display={`${Math.min(cloudSize, cloudSizeMax)}`}
                          min={1}
                          max={cloudSizeMax}
                          step={1}
                          value={Math.min(cloudSize, cloudSizeMax)}
                          onChange={setCloudSize}
                        />
                        <Knob
                          label="Size ratio"
                          hint="How much larger the biggest cover is than the smallest."
                          display={`${sizeRatio.toFixed(1)}×`}
                          min={MIN_SIZE_RATIO}
                          max={MAX_SIZE_RATIO}
                          step={0.1}
                          value={sizeRatio}
                          onChange={setSizeRatio}
                        />
                        <Knob
                          label="Zoom"
                          hint="Scales the whole cloud relative to the canvas. Zoom out for breathing room on large clouds."
                          display={`${Math.round(zoom * 100)}%`}
                          min={MIN_ZOOM}
                          max={MAX_ZOOM}
                          step={0.05}
                          value={zoom}
                          onChange={setZoom}
                        />
                      </VStack>
                    </Collapsible>
                  ) : null}

                  {phase === "cloud" ? (
                    <Collapsible
                      trigger="Development Controls"
                      defaultIsOpen={false}
                    >
                      <VStack gap={3} width="100%" paddingBlockStart={3}>
                        <Knob
                          label="Collision pad"
                          hint="Extra gap kept between covers to reduce overlap."
                          display={`${collisionPad}px`}
                          min={0}
                          max={24}
                          step={1}
                          value={collisionPad}
                          onChange={setCollisionPad}
                        />
                        <Knob
                          label="Frame width"
                          hint="Border thickness around each cover. Visual only — does not affect physics."
                          display={`${coverFrame}px`}
                          min={0}
                          max={8}
                          step={1}
                          value={coverFrame}
                          onChange={setCoverFrame}
                        />
                        <Knob
                          label="Centre pull"
                          hint="How strongly every cover is pulled toward the middle of the stage."
                          display={centerStrengthBase.toFixed(3)}
                          min={0}
                          max={0.12}
                          step={0.002}
                          value={centerStrengthBase}
                          onChange={setCenterStrengthBase}
                        />
                        <Knob
                          label="Mass pull"
                          hint="Extra centre pull for larger covers, so heavier albums sit more centrally."
                          display={centerStrengthMass.toFixed(3)}
                          min={0}
                          max={0.4}
                          step={0.005}
                          value={centerStrengthMass}
                          onChange={setCenterStrengthMass}
                        />
                        <Knob
                          label="Charge"
                          hint="How strongly covers push each other apart. More negative = more repulsion."
                          display={chargeStrength.toFixed(0)}
                          min={-40}
                          max={0}
                          step={1}
                          value={chargeStrength}
                          onChange={setChargeStrength}
                        />
                        <Knob
                          label="Settle speed"
                          hint="How quickly the simulation cools and the cloud stops drifting."
                          display={alphaDecay.toFixed(3)}
                          min={0.005}
                          max={0.1}
                          step={0.001}
                          value={alphaDecay}
                          onChange={setAlphaDecay}
                        />
                        <Knob
                          label="Collide passes"
                          hint="How many times per frame overlaps are resolved. Higher is firmer, more CPU."
                          display={`${collideIterations}`}
                          min={1}
                          max={8}
                          step={1}
                          value={collideIterations}
                          onChange={setCollideIterations}
                        />
                        <Knob
                          label="Collide strength"
                          hint="How firmly overlapping covers are shoved apart on each collide pass."
                          display={collideStrength.toFixed(2)}
                          min={0}
                          max={1}
                          step={0.05}
                          value={collideStrength}
                          onChange={setCollideStrength}
                        />
                        <Knob
                          label="Hover reheat"
                          hint="How strongly neighbours reflow when a cover swells on hover — not audio or scale speed."
                          display={hoverReheat.toFixed(2)}
                          min={0.05}
                          max={0.5}
                          step={0.01}
                          value={hoverReheat}
                          onChange={setHoverReheat}
                        />
                        <Knob
                          label="Boundary"
                          hint="How firmly covers are nudged back inside the padded stage edges."
                          display={boundaryStrength.toFixed(2)}
                          min={0}
                          max={1.5}
                          step={0.05}
                          value={boundaryStrength}
                          onChange={setBoundaryStrength}
                        />
                      </VStack>
                    </Collapsible>
                  ) : null}

                  <StackItem size="fill" />

                  <VStack gap={4} width="100%">
                    {showResolveStatus ? (
                      <VStack gap={2} width="100%">
                        {phase === "empty-match" ? (
                          <Text type="body" color="secondary">
                            {emptyStatusCopy}
                          </Text>
                        ) : null}
                        <HStack gap={2} align="center" width="100%">
                          <StatusDot
                            variant="accent"
                            label="Processed"
                            isPulsing={isResolving}
                          />
                          <Text type="body" color="secondary">
                            {progress.done}/{progress.total} processed
                          </Text>
                        </HStack>
                        <HStack gap={2} align="center" width="100%">
                          <StatusDot variant="success" label="Found" />
                          <Text type="body" color="secondary">
                            {progress.found} found
                          </Text>
                        </HStack>
                        <HStack gap={2} align="center" width="100%">
                          <StatusDot variant="error" label="Not found" />
                          <Text type="body" color="secondary">
                            {progress.dropped} not found
                          </Text>
                        </HStack>
                        <HStack gap={2} align="center" width="100%">
                          <StatusDot variant="neutral" label="Showing" />
                          <Text type="body" color="secondary">
                            {visible.length} showing
                          </Text>
                        </HStack>
                        {skippedLabel ? (
                          <Text type="supporting" color="secondary">
                            {skippedLabel}
                          </Text>
                        ) : null}
                      </VStack>
                    ) : (
                      <Text type="body" color="secondary">
                        {idleStatusCopy}
                      </Text>
                    )}

                    <Divider />
                    <AboutSection />
                  </VStack>
              </VStack>
            </Card>
          </LayoutPanel>
        }
        end={
          rightPanelOpen ? (
            <LayoutPanel
              width="var(--panel-width)"
              padding={0}
              isScrollable
              label="Details sidebar"
            >
              <Card width="100%" height="100%" padding={4}>
                <VStack gap={4} width="100%" height="100%">
                  <HStack width="100%" justify="start">
                    <IconButton
                      label="Collapse details sidebar"
                      tooltip="Collapse sidebar"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRightPanelOpen(false)}
                      icon={<Icon icon={PanelRightClose} size="sm" />}
                    />
                  </HStack>
                  <CloudInfoPanel
                    kind={cloudKind}
                    albumDetails={albumDetails}
                    trackDetails={trackDetails}
                    albumLoading={albumLoading}
                    trackLoading={trackLoading}
                    albumError={albumError}
                    trackError={trackError}
                    activeClip={focusedClip}
                    isLocked={locked != null}
                  />
                </VStack>
              </Card>
            </LayoutPanel>
          ) : null
        }
      >
        <LayoutContent padding={0} isScrollable={false} label="Cloud canvas">
          <div className="spa-canvas">
            {!rightPanelOpen ? (
              <div className="spa-panel-toggle spa-panel-toggle--end">
                <IconButton
                  label="Expand details sidebar"
                  tooltip="Expand sidebar"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRightPanelOpen(true)}
                  icon={<Icon icon={PanelRightOpen} size="sm" />}
                />
              </div>
            ) : null}
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
                  title="Cover art collage"
                  description="Create a collage of track or album art from Spotify or a manual list. Hover over a cover to play a short snippet of audio. Click to lock an item and the details will stay visible."
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
                  <Heading level={1}>Fetching covers and audio snippets</Heading>
                  <Text type="body" color="secondary">
                    If we can't find a cover or audio snippet, it won't be shown in the collage.
                  </Text>
                  <ProgressBar
                    label="Lookup progress"
                    value={progressPercent}
                    max={100}
                    hasValueLabel
                    formatValueLabel={() =>
                      `${progress.done} / ${progress.total} · ${progress.found} found · ${progress.dropped} not found`
                    }
                  />
                </VStack>
              </div>
            ) : null}

            {phase === "empty-match" ? (
              <div className="spa-empty">
                <EmptyState
                  title="No snippets matched"
                  description="None of the albums were found. A tighter album + artist list matches more often. Nothing is shown without audio."
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
                  <div
                    className="spa-cloud-unlock"
                    role="button"
                    tabIndex={0}
                    aria-label="Click to view cloud and enable audio"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void enableAudio();
                      }
                    }}
                  >
                    <Text type="supporting" className="spa-cloud-unlock__label">
                      Click to view cloud and enable audio
                    </Text>
                  </div>
                ) : null}
                <CoverCloud
                  cloudKind={cloudKind}
                  items={visible}
                  audioUnlocked={audioUnlocked}
                  sizeRatio={sizeRatio}
                  zoom={zoom}
                  collisionPad={collisionPad}
                  physics={physics}
                  lockedId={
                    exportNeutral
                      ? null
                      : locked
                        ? cloudNodeId(cloudKind, locked)
                        : null
                  }
                  neutralVisuals={exportNeutral}
                  frameRef={cloudFrameRef}
                  exploreResetToken={exploreResetToken}
                  onHoverChange={setHovered}
                  onLockToggle={lockCloud}
                  onPreviewChange={setHoverPreview}
                />
              </div>
            ) : null}
          </div>
        </LayoutContent>
      </Layout>

      <SaveModal
        open={saveOpen}
        cloudKind={cloudKind}
        document={shareDocument}
        getCloudFrame={() => cloudFrameRef.current}
        prepareNeutralCapture={prepareNeutralCapture}
        onClose={closeSave}
      />

      <UploadModal
        open={uploadOpen}
        dismissible={canDismissUpload}
        onClose={closeUpload}
        title={
          createGate === "warning" ? "Replace current cloud?" : createModalTitle
        }
      >
        {createGate === "warning" ? (
          <VStack gap={4} width="100%">
            <Banner
              status="warning"
              title={
                replaceWarningReason === "share"
                  ? "Opening this shared cloud will overwrite the existing one."
                  : "Creating a new cloud will overwrite the existing one."
              }
              description="Do you want to save your work first?"
              collapsible={false}
            />
            <Grid columns={2} gap={2} width="100%">
              <Button
                label="Save first"
                variant="secondary"
                width="100%"
                onClick={() => {
                  closeUpload();
                  openSave();
                }}
              />
              <Button
                label={
                  replaceWarningReason === "share"
                    ? "Open anyway"
                    : "Create anyway"
                }
                variant="primary"
                width="100%"
                onClick={confirmReplaceWarning}
              />
            </Grid>
          </VStack>
        ) : (
          <CreateCloudFlow
            key={createFlowKey}
            initialError={oauthError}
            onTitleChange={setCreateModalTitle}
            onAlbumParsed={(result) => void startAlbumResolve(result)}
            onTrackParsed={(result) =>
              void startTrackResolve(result.listens, result.sourceLabel)
            }
            onSpotifyTracks={(listens, sourceLabel) =>
              void startTrackResolve(listens, sourceLabel)
            }
          />
        )}
      </UploadModal>

      <ShareModal
        open={shareOpen}
        document={shareDocument}
        cloudKind={cloudKind}
        onClose={closeShare}
      />
    </div>
  );
}

function Knob({
  label,
  hint,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  hint: string;
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
      labelTooltip={hint}
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

async function resolveAlbumOne(listen: AlbumListen): Promise<PreviewHit | null> {
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

async function resolveTrackOne(listen: TrackListen): Promise<TrackHit | null> {
  const key = trackCacheKey(listen.track, listen.artist);
  const cached = await idbTrackGet(key);
  if (cached) {
    return { ...cached, listenCount: listen.listenCount };
  }

  const response = await fetch("/api/preview-track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      track: listen.track,
      artist: listen.artist,
      album: listen.album,
    }),
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("preview lookup failed");
  }

  const data = (await response.json()) as {
    coverUrl: string;
    clips: TrackHit["clips"];
    track: string;
    artist: string;
    album?: string;
  };
  if (!Array.isArray(data.clips) || data.clips.length === 0) {
    return null;
  }
  const stored = {
    coverUrl: data.coverUrl,
    clips: data.clips.slice(0, 1),
    track: data.track,
    artist: data.artist,
    album: data.album,
  };
  await idbTrackSet(key, stored);
  return {
    ...stored,
    track: listen.track,
    artist: listen.artist,
    album: listen.album ?? data.album,
    listenCount: listen.listenCount,
  };
}

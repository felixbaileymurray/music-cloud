"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Download, ListMusic, Plus, Share2 } from "lucide-react";
import { CollageModeSwitch } from "@/components/collage/collage-mode-switch";
import {
  CollageShell,
  useCollageLayoutState,
} from "@/components/collage/collage-shell";
import { CloudInfoPanel } from "@/components/cloud-info-panel";
import { CreateCloudFlow } from "@/components/create-cloud-flow";
import { useMusicCloudAudio } from "@/components/music/use-music-cloud-audio";
import { ResolveStatusMatchCounts } from "@/components/resolve-status-summary";
import { SaveModal } from "@/components/save-modal";
import { ShareModal } from "@/components/share-modal";
import { UploadModal } from "@/components/upload-modal";
import {
  cloudNodeId,
  hitsMatchFocus,
  sameCloudHit,
} from "@/lib/cloud-node";
import { hitsToCollageItems } from "@/lib/music-collage-items";
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

type Phase = "idle" | "resolve" | "cloud" | "empty-match";

export function MusicCollage() {
  const [phase, setPhase] = useState<Phase>("idle");
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
  const [exploreResetToken, setExploreResetToken] = useState(0);
  const albumDetailsCacheRef = useRef(new Map<string, AlbumDetails>());
  const trackDetailsCacheRef = useRef(new Map<string, TrackDetails>());
  const resolveRunRef = useRef(0);

  const cloudSizeMax = Math.max(1, resolved.length);
  const layout = useCollageLayoutState(cloudSizeMax);

  const focused = locked ?? hovered;

  const visible = useMemo(
    () =>
      resolved.slice(
        0,
        Math.max(1, Math.min(layout.cloudSize, resolved.length))
      ),
    [layout.cloudSize, resolved]
  );

  const hitsById = useMemo(() => {
    const map = new Map<string, CloudHit>();
    for (const hit of visible) {
      map.set(cloudNodeId(cloudKind, hit), hit);
    }
    return map;
  }, [cloudKind, visible]);

  const visibleItems = useMemo(
    () => hitsToCollageItems(cloudKind, visible),
    [cloudKind, visible]
  );

  const lockedId =
    locked && !exportNeutral ? cloudNodeId(cloudKind, locked) : null;
  const hoveredId = hovered ? cloudNodeId(cloudKind, hovered) : null;

  const { hoverPreview, onItemHover, resetAudio } = useMusicCloudAudio(
    cloudKind,
    hitsById,
    audioUnlocked,
    lockedId,
    hoveredId
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
    resetAudio();
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

  function cancelProcessing() {
    resolveRunRef.current += 1;
    setPhase("idle");
    setParsed(null);
    setResolved([]);
    setProgress({ done: 0, total: 0, found: 0, dropped: 0 });
    setResolveError(null);
    setHovered(null);
    setLocked(null);
    resetAudio();
  }

  async function startAlbumResolve(result: ParseResult) {
    setCloudKind("album");
    setParsed(result);
    setUploadOpen(false);
    setPhase("resolve");
    setResolveError(null);
    setHovered(null);
    setLocked(null);
    resetAudio();
    setProgress({
      done: 0,
      total: result.listens.length,
      found: 0,
      dropped: 0,
    });

    const runId = ++resolveRunRef.current;
    const kept: PreviewHit[] = [];
    let done = 0;
    let found = 0;
    let dropped = 0;
    let cursor = 0;
    const listens = result.listens;

    async function worker() {
      while (cursor < listens.length) {
        if (resolveRunRef.current !== runId) return;
        const index = cursor;
        cursor += 1;
        const listen = listens[index];
        const hit = await resolveAlbumOne(listen);
        if (resolveRunRef.current !== runId) return;
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
      if (resolveRunRef.current !== runId) return;
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
      layout.setCloudSize(defaultCloudSize(kept.length));
      setPhase("cloud");
    } catch {
      if (resolveRunRef.current !== runId) return;
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
    resetAudio();
    setProgress({
      done: 0,
      total: listens.length,
      found: 0,
      dropped: 0,
    });

    const runId = ++resolveRunRef.current;
    const kept: TrackHit[] = [];
    let done = 0;
    let found = 0;
    let dropped = 0;
    let cursor = 0;

    async function worker() {
      while (cursor < listens.length) {
        if (resolveRunRef.current !== runId) return;
        const index = cursor;
        cursor += 1;
        const listen = listens[index];
        const hit = await resolveTrackOne(listen);
        if (resolveRunRef.current !== runId) return;
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
      if (resolveRunRef.current !== runId) return;
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
      layout.setCloudSize(defaultCloudSize(kept.length));
      setPhase("cloud");
    } catch {
      if (resolveRunRef.current !== runId) return;
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

  async function prepareNeutralCapture() {
    setExportNeutral(true);
    setHovered(null);
    resetAudio();
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

  const canvasOverlay = (
    <>
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
          <VStack gap={4} width="100%" align="center">
            <VStack gap={2} width="100%" align="center">
              <Heading level={1} justify="center">
                Cover art collage
              </Heading>
              <Text type="body" color="secondary" justify="center">
                Create a collage of track or album art from Spotify or a manual
                list. Hover over a cover to play a short snippet of audio. Click
                to lock an item and the details will stay visible.
              </Text>
            </VStack>
            {!uploadOpen ? (
              <Button
                label="Create"
                variant="primary"
                icon={<Icon icon={Plus} size="sm" />}
                onClick={openCreate}
              />
            ) : null}
          </VStack>
        </div>
      ) : null}

      {phase === "resolve" && parsed ? (
        <div className="spa-status">
          <VStack gap={4} width="100%" align="center">
            <VStack gap={2} width="100%" align="center">
              <Heading level={1} justify="center">
                Processing…
              </Heading>
              <Text type="body" color="secondary" justify="center">
                We&apos;re finding cover art and audio snippets for the items you
                provided. If that information isn&apos;t available, we won&apos;t
                show it in the collage.
              </Text>
            </VStack>
            <VStack width="100%" align="stretch">
              <ProgressBar
                label="Lookup progress"
                value={progressPercent}
                max={100}
                hasValueLabel
                formatValueLabel={() =>
                  `${progress.done} / ${progress.total}`
                }
              />
            </VStack>
            <ResolveStatusMatchCounts
              progress={progress}
              skippedLabel={skippedLabel}
              isCentered
            />
            <Button
              label="Cancel"
              variant="secondary"
              onClick={cancelProcessing}
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

    </>
  );

  const stageOverlay =
    phase === "cloud" && !audioUnlocked ? (
      <div
        className="spa-cloud-unlock"
        role="button"
        tabIndex={0}
        aria-label="Click to view cloud and enable audio"
        onPointerDown={() => void enableAudio()}
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
    ) : null;

  return (
    <CollageShell
      modeSwitch={<CollageModeSwitch />}
      hasCloud={hasCloud}
      showCustomise={phase === "cloud"}
      sidebarActions={
        <VStack gap={2} width="100%">
          <Button
            label="Share"
            variant="primary"
            icon={<Icon icon={Share2} size="sm" />}
            width="100%"
            onClick={() => setShareOpen(true)}
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
              onClick={() => setSaveOpen(true)}
            />
          </Grid>
        </VStack>
      }
      rightPanel={
        <CloudInfoPanel
          kind={cloudKind}
          albumDetails={albumDetails}
          trackDetails={trackDetails}
          albumLoading={albumLoading}
          trackLoading={trackLoading}
          albumError={albumError}
          trackError={trackError}
          activeClip={focusedClip}
        />
      }
      rightPanelToggleIcon={ListMusic}
      canvasOverlay={canvasOverlay}
      stageOverlay={stageOverlay}
      visibleItems={visibleItems}
      lockedId={lockedId}
      neutralVisuals={exportNeutral}
      exploreResetToken={exploreResetToken}
      cloudFrameRef={cloudFrameRef}
      onHoverChange={(item) => {
        if (!item) {
          setHovered(null);
          onItemHover(null);
          return;
        }
        const hit = hitsById.get(item.id);
        setHovered(hit ?? null);
        onItemHover(item);
      }}
      onLockToggle={(item) => {
        const hit = hitsById.get(item.id);
        if (hit) lockCloud(hit);
      }}
      onCanvasPointerDown={onCanvasPointerDown}
      layout={layout}
      modals={
        <>
          <SaveModal
            open={saveOpen}
            featureLabel={cloudKind}
            document={shareDocument}
            showJsonBackup
            getCloudFrame={() => cloudFrameRef.current}
            prepareNeutralCapture={prepareNeutralCapture}
            onClose={() => {
              setSaveOpen(false);
              setExportNeutral(false);
            }}
          />
          <UploadModal
            open={uploadOpen}
            dismissible={canDismissUpload}
            onClose={closeUpload}
            title={
              createGate === "warning"
                ? "Replace current cloud?"
                : createModalTitle
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
                      setSaveOpen(true);
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
            onClose={() => setShareOpen(false)}
          />
        </>
      }
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

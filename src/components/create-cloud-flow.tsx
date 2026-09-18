"use client";

import { useCallback, useEffect, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HistoryIntake } from "@/components/history-intake";
import type { ParseKind } from "@/lib/parse-history";
import type {
  AnyParseResult,
  CloudKind,
  ParseResult,
  TrackListen,
  TrackParseResult,
} from "@/lib/types";

type BuildRoute = "spotify" | "manual";
type Step = "chooser" | "kind" | "spotify-source" | "manual";

export type CreateCloudFlowProps = {
  onAlbumParsed: (result: ParseResult) => void;
  onTrackParsed: (result: TrackParseResult) => void;
  onSpotifyTracks: (listens: TrackListen[], sourceLabel: string) => void;
  onTitleChange?: (title: string) => void;
  resumeAfterOAuth?: boolean;
  initialError?: string | null;
};

type SpotifyStatus = {
  connected: boolean;
  configured: boolean;
  displayName?: string;
};

export function CreateCloudFlow({
  onAlbumParsed,
  onTrackParsed,
  onSpotifyTracks,
  onTitleChange,
  resumeAfterOAuth = false,
  initialError = null,
}: CreateCloudFlowProps) {
  const [step, setStep] = useState<Step>(
    resumeAfterOAuth ? "kind" : "chooser"
  );
  const [route, setRoute] = useState<BuildRoute | null>(
    resumeAfterOAuth ? "spotify" : null
  );
  const [parseKind, setParseKind] = useState<ParseKind>("track");
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"top" | "recent" | "saved">("top");
  const [timeRange, setTimeRange] = useState<
    "short_term" | "medium_term" | "long_term"
  >("medium_term");

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/spotify/status");
      const data = (await response.json()) as SpotifyStatus;
      setStatus(data);
    } catch {
      setStatus({ connected: false, configured: false });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const titles: Record<Step, string> = {
      chooser: "Create cloud",
      kind: "What to cloud?",
      "spotify-source": "Choose tracks",
      manual: parseKind === "track" ? "Upload tracks" : "Upload albums",
    };
    onTitleChange?.(titles[step]);
  }, [onTitleChange, parseKind, step]);

  function goChooser() {
    setError(null);
    setStep("chooser");
    setRoute(null);
  }

  function startManual() {
    setRoute("manual");
    setStep("kind");
  }

  function startSpotify() {
    if (!status?.configured) {
      setError("Spotify is not configured on this server.");
      return;
    }
    if (!status.connected) {
      window.location.href = "/api/spotify/login";
      return;
    }
    setRoute("spotify");
    setStep("kind");
  }

  function pickKind(kind: CloudKind) {
    if (kind === "artist") return;
    if (route === "spotify" && kind !== "track") return;
    if (kind === "album") {
      setParseKind("album");
    } else {
      setParseKind("track");
    }
    setStep(route === "spotify" ? "spotify-source" : "manual");
  }

  function handleManualParsed(result: AnyParseResult) {
    if (result.kind === "track") {
      onTrackParsed(result);
    } else {
      onAlbumParsed(result);
    }
  }

  async function buildFromSpotify() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/spotify/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, timeRange }),
      });
      if (response.status === 401) {
        setError("Spotify session expired. Connect again.");
        setStep("chooser");
        setRoute(null);
        return;
      }
      if (!response.ok) {
        setError("Could not load tracks from Spotify.");
        return;
      }
      const data = (await response.json()) as {
        listens: TrackListen[];
        sourceLabel: string;
      };
      if (!data.listens?.length) {
        setError("Spotify returned no tracks for that source.");
        return;
      }
      onSpotifyTracks(data.listens, data.sourceLabel);
    } catch {
      setError("Could not load tracks from Spotify.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "chooser") {
    return (
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Connect Spotify for live top, recent, and saved tracks — or upload a
          listening history export manually.
        </Text>
        <VStack gap={2} width="100%">
          <Button
            label={
              statusLoading
                ? "Checking Spotify…"
                : status?.connected
                  ? `Continue with Spotify${status.displayName ? ` (${status.displayName})` : ""}`
                  : "Connect Spotify"
            }
            variant="primary"
            width="100%"
            isDisabled={statusLoading || status?.configured === false}
            onClick={startSpotify}
          />
          <Button
            label="Create manually"
            variant="secondary"
            width="100%"
            onClick={startManual}
          />
        </VStack>
        {status?.configured === false ? (
          <Banner
            status="warning"
            title="Spotify login is not configured on this server."
            collapsible={false}
          />
        ) : null}
        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}
      </VStack>
    );
  }

  if (step === "kind") {
    const albumsDisabled = route === "spotify";
    const artistsDisabled = true;

    return (
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Pick what each cover in the cloud represents.
        </Text>
        <VStack gap={2} width="100%">
          <Button
            label="Tracks"
            variant="primary"
            width="100%"
            onClick={() => pickKind("track")}
          />
          <Button
            label={albumsDisabled ? "Albums (soon)" : "Albums"}
            variant="secondary"
            width="100%"
            isDisabled={albumsDisabled}
            onClick={() => pickKind("album")}
          />
          <Button
            label="Artists (soon)"
            variant="ghost"
            width="100%"
            isDisabled={artistsDisabled}
            onClick={() => pickKind("artist")}
          />
        </VStack>
        <Button label="Back" variant="ghost" width="100%" onClick={goChooser} />
      </VStack>
    );
  }

  if (step === "spotify-source") {
    return (
      <VStack gap={5} width="100%">
        <VStack gap={2} width="100%">
          <Button
            label="Top tracks"
            variant={source === "top" ? "primary" : "secondary"}
            width="100%"
            onClick={() => setSource("top")}
          />
          {source === "top" ? (
            <HStack gap={2} wrap="wrap" width="100%">
              <Button
                label="4 weeks"
                variant={timeRange === "short_term" ? "primary" : "ghost"}
                onClick={() => setTimeRange("short_term")}
              />
              <Button
                label="6 months"
                variant={timeRange === "medium_term" ? "primary" : "ghost"}
                onClick={() => setTimeRange("medium_term")}
              />
              <Button
                label="All time"
                variant={timeRange === "long_term" ? "primary" : "ghost"}
                onClick={() => setTimeRange("long_term")}
              />
            </HStack>
          ) : null}
          <Button
            label="Recently played"
            variant={source === "recent" ? "primary" : "secondary"}
            width="100%"
            onClick={() => setSource("recent")}
          />
          <Button
            label="Recently saved"
            variant={source === "saved" ? "primary" : "secondary"}
            width="100%"
            onClick={() => setSource("saved")}
          />
        </VStack>
        <Button
          label="Build cloud"
          variant="primary"
          width="100%"
          isDisabled={busy}
          isLoading={busy}
          onClick={() => void buildFromSpotify()}
        />
        <Button
          label="Back"
          variant="ghost"
          width="100%"
          onClick={() => setStep("kind")}
        />
        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}
      </VStack>
    );
  }

  return (
    <VStack gap={4} width="100%">
      <HistoryIntake kind={parseKind} onParsed={handleManualParsed} />
      <Button
        label="Back"
        variant="ghost"
        width="100%"
        onClick={() => setStep("kind")}
      />
    </VStack>
  );
}

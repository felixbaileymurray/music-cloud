"use client";

import { useCallback, useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Disc3, Music2, PenLine, UserRound } from "lucide-react";
import { HistoryIntake } from "@/components/history-intake";
import { SpotifyIcon } from "@/components/streaming-service-icons";
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
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

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

function OptionCard({
  label,
  title,
  description,
  icon,
  isDisabled = false,
  footer,
  onClick,
}: {
  label: string;
  title: string;
  description: string;
  icon: IconComponent;
  isDisabled?: boolean;
  footer?: string | null;
  onClick: () => void;
}) {
  return (
    <ClickableCard
      label={label}
      width="100%"
      height="100%"
      isDisabled={isDisabled}
      onClick={onClick}
    >
      <VStack gap={2} width="100%">
        <HStack gap={2} align="center">
          <Icon icon={icon} size="sm" color="secondary" />
          <Heading level={4}>{title}</Heading>
        </HStack>
        <Text type="body" color="secondary">
          {description}
        </Text>
        {footer ? (
          <Text type="supporting" color="secondary">
            {footer}
          </Text>
        ) : null}
      </VStack>
    </ClickableCard>
  );
}

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
      chooser: "Create Cloud",
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
    const spotifyDisabled =
      statusLoading || status?.configured === false;
    const spotifyLabel = statusLoading
      ? "Checking Spotify…"
      : status?.connected
        ? `Continue with Spotify${status.displayName ? ` (${status.displayName})` : ""}`
        : "Connect Spotify";

    return (
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Choose a way to create your personalised music cloud.
        </Text>
        <Grid columns={2} gap={3} width="100%" align="stretch">
          <OptionCard
            label={spotifyLabel}
            title="Connect Spotify"
            description="Connect your Spotify account to access your top, recent, and saved content."
            icon={SpotifyIcon}
            isDisabled={spotifyDisabled}
            footer={
              status?.connected && status.displayName
                ? `Connected as ${status.displayName}`
                : null
            }
            onClick={startSpotify}
          />
          <OptionCard
            label="Create Manually"
            title="Create Manually"
            description="Upload a listening history export, or input your own list."
            icon={PenLine}
            onClick={startManual}
          />
        </Grid>
        <Banner
          status="info"
          title="Privacy"
          description="We never receive your Spotify password. Session tokens stay encrypted in your browser, and we don't keep a permanent copy of your listening history on our servers. Preview covers may be cached locally on this device."
          collapsible={false}
        />
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
        <Grid columns={3} gap={3} width="100%" align="stretch">
          <OptionCard
            label="Tracks"
            title="Tracks"
            description="Each cover is a track, sized by how much you listen."
            icon={Music2}
            onClick={() => pickKind("track")}
          />
          <OptionCard
            label="Albums"
            title="Albums"
            description={
              albumsDisabled
                ? "Coming soon"
                : "Each cover is an album, sized by how much you listen."
            }
            icon={Disc3}
            isDisabled={albumsDisabled}
            onClick={() => pickKind("album")}
          />
          <OptionCard
            label="Artists"
            title="Artists"
            description="Coming soon"
            icon={UserRound}
            isDisabled={artistsDisabled}
            onClick={() => pickKind("artist")}
          />
        </Grid>
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

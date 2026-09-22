"use client";

import { useCallback, useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Disc3, Music2, PenLine, Sparkles, UserRound } from "lucide-react";
import { HistoryIntake } from "@/components/history-intake";
import { SpotifyIcon } from "@/components/streaming-service-icons";
import { buildExampleAlbumParseResult } from "@/lib/example-albums";
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
  footerAccent = false,
  onClick,
}: {
  label: string;
  title: string;
  description: string;
  icon: IconComponent;
  isDisabled?: boolean;
  footer?: string | null;
  /** Bold + success green (WCAG AA on white). Brand Spotify green fails contrast. */
  footerAccent?: boolean;
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
          <Text
            type="supporting"
            weight={footerAccent ? "bold" : undefined}
            color={footerAccent ? "inherit" : "secondary"}
            className={footerAccent ? "text-success" : undefined}
          >
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
  initialError = null,
}: CreateCloudFlowProps) {
  const [step, setStep] = useState<Step>("chooser");
  const [route, setRoute] = useState<BuildRoute | null>(null);
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

  function startExample() {
    setError(null);
    onAlbumParsed(buildExampleAlbumParseResult());
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
        <Grid columns={3} gap={3} width="100%" align="stretch">
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
            footerAccent={Boolean(status?.connected && status.displayName)}
            onClick={startSpotify}
          />
          <OptionCard
            label="Create Manually"
            title="Create Manually"
            description="Upload a listening history export, or input your own list."
            icon={PenLine}
            onClick={startManual}
          />
          <OptionCard
            label="See an example"
            title="See an example"
            description="Generate an example cloud without entering any information."
            icon={Sparkles}
            onClick={startExample}
          />
        </Grid>
        {!status?.connected ? (
          <Banner
            status="info"
            title="Privacy"
            description="We never receive your Spotify password. Session tokens stay encrypted in your browser, and we don't keep a permanent copy of your listening history on our servers. Preview covers may be cached locally on this device."
            collapsible={false}
          />
        ) : null}
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
        <VStack gap={4} width="100%">
          <SegmentedControl
            label="Track source"
            value={source}
            onChange={(value) =>
              setSource(value as "top" | "recent" | "saved")
            }
            layout="fill"
            size="md"
          >
            <SegmentedControlItem value="top" label="Top tracks" />
            <SegmentedControlItem value="recent" label="Recently played" />
            <SegmentedControlItem value="saved" label="Recently saved" />
          </SegmentedControl>

          {source === "top" ? (
            <RadioList
              label="Time range"
              value={timeRange}
              onChange={(value) =>
                setTimeRange(
                  value as "short_term" | "medium_term" | "long_term"
                )
              }
              width="100%"
            >
              <RadioListItem value="short_term" label="4 weeks" />
              <RadioListItem value="medium_term" label="6 months" />
              <RadioListItem value="long_term" label="All time" />
            </RadioList>
          ) : null}
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

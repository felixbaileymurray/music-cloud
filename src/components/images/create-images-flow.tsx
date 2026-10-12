"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { PenLine, Sparkles } from "lucide-react";
import { ImageIntake } from "@/components/images/image-intake";
import { buildExampleImageItems } from "@/lib/example-images";

type Step = "chooser" | "manual";
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type CreateImagesFlowProps = {
  onFilesSelected: (files: File[]) => void;
  onExampleReady: (
    images: ReturnType<typeof buildExampleImageItems>
  ) => void;
  onTitleChange?: (title: string) => void;
};

function OptionCard({
  label,
  title,
  description,
  icon,
  isDisabled = false,
  onClick,
}: {
  label: string;
  title: string;
  description: string;
  icon: IconComponent;
  isDisabled?: boolean;
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
      </VStack>
    </ClickableCard>
  );
}

/**
 * Images create journey — parallel to `CreateCloudFlow`, kept separate so
 * music (Spotify / kinds / resolve) and images (files / static examples) can
 * diverge without sharing a single state machine.
 */
export function CreateImagesFlow({
  onFilesSelected,
  onExampleReady,
  onTitleChange,
}: CreateImagesFlowProps) {
  const [step, setStep] = useState<Step>("chooser");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const titles: Record<Step, string> = {
      chooser: "Create a collage",
      manual: "Add images",
    };
    onTitleChange?.(titles[step]);
  }, [onTitleChange, step]);

  function goChooser() {
    setError(null);
    setStep("chooser");
  }

  function startManual() {
    setError(null);
    setStep("manual");
  }

  function startExample() {
    setError(null);
    try {
      onExampleReady(buildExampleImageItems());
    } catch {
      setError("Could not load the example collage.");
    }
  }

  if (step === "chooser") {
    return (
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Choose a way to create your image collage.
        </Text>
        <Grid columns={2} gap={3} width="100%" align="stretch">
          <OptionCard
            label="Create Manually"
            title="Create Manually"
            description="Upload photos from your device. They stay in this browser."
            icon={PenLine}
            onClick={startManual}
          />
          <OptionCard
            label="See an example"
            title="See an example"
            description="Load an architecture photo set without uploading anything."
            icon={Sparkles}
            onClick={startExample}
          />
        </Grid>
        <Banner
          status="info"
          title="Privacy"
          description="Photos you upload stay on this device as local object URLs. Nothing is sent to a server. The example path uses bundled Unsplash architecture photos shipped with the app."
          collapsible={false}
        />
        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}
      </VStack>
    );
  }

  return (
    <VStack gap={4} width="100%">
      <ImageIntake onFilesSelected={onFilesSelected} />
      <Button label="Back" variant="ghost" width="100%" onClick={goChooser} />
    </VStack>
  );
}

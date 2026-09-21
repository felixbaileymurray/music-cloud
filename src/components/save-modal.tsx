"use client";

import { useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Download } from "lucide-react";
import { UploadModal } from "@/components/upload-modal";
import {
  captureCloudImage,
  downloadBlob,
  saveImageFileName,
  type SaveImageFormat,
  type SaveQualityPreset,
} from "@/lib/save-image";
import type { CloudKind } from "@/lib/types";

export function SaveModal({
  open,
  cloudKind,
  getCloudFrame,
  prepareNeutralCapture,
  onClose,
}: {
  open: boolean;
  cloudKind: CloudKind;
  getCloudFrame: () => HTMLElement | null;
  /** Clears hover / lock visuals, waits a paint, returns a restore fn. */
  prepareNeutralCapture: () => Promise<() => void>;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<SaveImageFormat>("png");
  const [resolution, setResolution] = useState<SaveQualityPreset>("medium");
  const [jpegQuality, setJpegQuality] =
    useState<SaveQualityPreset>("high");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadImage() {
    setBusy(true);
    setError(null);
    let restore: (() => void) | null = null;
    try {
      restore = await prepareNeutralCapture();
      const frame = getCloudFrame();
      if (!frame) {
        throw new Error("Cloud canvas is not ready to export.");
      }
      const blob = await captureCloudImage(frame, {
        format,
        resolution,
        jpegQuality,
      });
      downloadBlob(blob, saveImageFileName(cloudKind, format));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save an image of the cloud."
      );
    } finally {
      restore?.();
      setBusy(false);
    }
  }

  return (
    <UploadModal open={open} title="Save cloud" onClose={onClose}>
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Download a still image of the cloud as it looks now. Arrange the
          layout in the window before saving — the export matches the current
          canvas size and aspect ratio.
        </Text>

        <VStack gap={2} width="100%">
          <Text type="supporting">Format</Text>
          <SegmentedControl
            label="Image format"
            value={format}
            onChange={(value) => setFormat(value as SaveImageFormat)}
            layout="fill"
            size="md"
          >
            <SegmentedControlItem value="png" label="PNG" />
            <SegmentedControlItem value="jpeg" label="JPEG" />
          </SegmentedControl>
        </VStack>

        <RadioList
          label="Resolution"
          description="How many pixels relative to the on-screen canvas."
          value={resolution}
          onChange={(value) => setResolution(value as SaveQualityPreset)}
          width="100%"
        >
          <RadioListItem
            value="low"
            label="Low"
            description="1× — smaller file, matches screen pixels"
          />
          <RadioListItem
            value="medium"
            label="Medium"
            description="2× — good for sharing"
          />
          <RadioListItem
            value="high"
            label="High"
            description="3× — sharper for print or zoom"
          />
        </RadioList>

        {format === "jpeg" ? (
          <RadioList
            label="JPEG quality"
            description="Compression trade-off. Does not change pixel dimensions."
            value={jpegQuality}
            onChange={(value) => setJpegQuality(value as SaveQualityPreset)}
            width="100%"
          >
            <RadioListItem value="low" label="Low" description="Smaller file" />
            <RadioListItem
              value="medium"
              label="Medium"
              description="Balanced"
            />
            <RadioListItem
              value="high"
              label="High"
              description="Fewer compression artifacts"
            />
          </RadioList>
        ) : null}

        <Button
          label="Download image"
          variant="primary"
          icon={<Icon icon={Download} size="sm" />}
          width="100%"
          isLoading={busy}
          isDisabled={busy}
          onClick={() => void downloadImage()}
        />

        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}

        <Text type="supporting" color="secondary">
          JSON backup export will land once Share ships — same snapshot format
          for re-opening a cloud later.
        </Text>
      </VStack>
    </UploadModal>
  );
}

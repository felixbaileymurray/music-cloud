"use client";

import { useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Download, FileJson } from "lucide-react";
import { UploadModal } from "@/components/upload-modal";
import {
  captureCloudImage,
  downloadBlob,
  saveImageFileName,
  saveJsonFileName,
  type SaveImageFormat,
  type SaveResolutionPreset,
} from "@/lib/save-image";
import {
  shareDocumentToJson,
  type ShareDocumentV1,
} from "@/lib/share-payload";
import type { SaveFeatureLabel } from "@/lib/save-image";

export function SaveModal({
  open,
  featureLabel,
  document: shareDoc,
  showJsonBackup = true,
  getCloudFrame,
  prepareNeutralCapture,
  onClose,
}: {
  open: boolean;
  featureLabel: SaveFeatureLabel;
  document: ShareDocumentV1 | null;
  showJsonBackup?: boolean;
  getCloudFrame: () => HTMLElement | null;
  /** Clears hover / lock visuals, waits a paint, returns a restore fn. */
  prepareNeutralCapture: (
    resolution?: SaveResolutionPreset
  ) => Promise<() => void>;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<SaveImageFormat>("png");
  const [resolution, setResolution] =
    useState<SaveResolutionPreset>("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadImage() {
    setBusy(true);
    setError(null);
    let restore: (() => void) | null = null;
    try {
      restore = await prepareNeutralCapture(resolution);
      const frame = getCloudFrame();
      if (!frame) {
        throw new Error("The collage canvas is not ready to export.");
      }
      const blob = await captureCloudImage(frame, {
        format,
        resolution,
      });
      downloadBlob(blob, saveImageFileName(featureLabel, format));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save an image of the collage."
      );
    } finally {
      restore?.();
      setBusy(false);
    }
  }

  function downloadJson() {
    if (!shareDoc) return;
    setError(null);
    const blob = new Blob([shareDocumentToJson(shareDoc)], {
      type: "application/json",
    });
    downloadBlob(blob, saveJsonFileName(featureLabel));
  }

  const listenCount = shareDoc?.listens.length ?? 0;

  return (
    <UploadModal open={open} title="Save cloud" onClose={onClose}>
      <VStack gap={5} width="100%">
        <Text type="body" color="secondary">
          Save a still image of the collage as you see it. Or download a file backup of the visible
          items so you can rebuild the collage at another time.
        </Text>

        <VStack gap={4} width="100%">
          <Heading level={3}>Image</Heading>
          <Text type="body" color="secondary">
            The exported image will contain everything you can see on the canvas, and the size and aspect ratio will stay the same.
          </Text>

          <VStack gap={2} width="100%">
            <Heading level={4}>Format</Heading>
            <SegmentedControl
              label="Image format"
              value={format}
              onChange={(value) => setFormat(value as SaveImageFormat)}
              layout="fill"
              size="md"
            >
              <SegmentedControlItem value="png" label="PNG" />
              <SegmentedControlItem value="jpeg" label="JPEG" />
              <SegmentedControlItem value="webp" label="WebP" />
            </SegmentedControl>
          </VStack>

          <VStack gap={2} width="100%">
            <Heading level={4}>Resolution</Heading>
            <RadioList
              label="Resolution"
              isLabelHidden
              description="How many pixels relative to the on-screen canvas. Higher resolution means a bigger file."
              value={resolution}
              onChange={(value) => setResolution(value as SaveResolutionPreset)}
              width="100%"
            >
              <RadioListItem
                value="low"
                label="Low"
                description="1× — lower quality, smaller file"
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
          </VStack>

          <Button
            label="Download image"
            variant="primary"
            icon={<Icon icon={Download} size="sm" />}
            width="100%"
            isLoading={busy}
            isDisabled={busy}
            onClick={() => void downloadImage()}
          />
        </VStack>

        {showJsonBackup ? (
          <VStack gap={3} width="100%">
            <Heading level={3}>File Backup</Heading>
            <Text type="body" color="secondary">
              {shareDoc
                ? `Save a list containing data about the ${listenCount} items currently shown in the collage. You can re-upload the file later to create another collage.`
                : "Create a cloud first to save a JSON backup."}
            </Text>
            <Button
              label="Download JSON"
              variant="secondary"
              icon={<Icon icon={FileJson} size="sm" />}
              width="100%"
              isDisabled={!shareDoc || busy}
              onClick={downloadJson}
            />
          </VStack>
        ) : null}

        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}
      </VStack>
    </UploadModal>
  );
}

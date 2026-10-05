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
  shareItemTypeLabel,
  type ShareDocumentV1,
} from "@/lib/share-payload";
import type { CloudKind } from "@/lib/types";

export function SaveModal({
  open,
  cloudKind,
  document: shareDoc,
  getCloudFrame,
  prepareNeutralCapture,
  onClose,
}: {
  open: boolean;
  cloudKind: CloudKind;
  document: ShareDocumentV1 | null;
  getCloudFrame: () => HTMLElement | null;
  /** Clears hover / lock visuals, waits a paint, returns a restore fn. */
  prepareNeutralCapture: () => Promise<() => void>;
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
      restore = await prepareNeutralCapture();
      const frame = getCloudFrame();
      if (!frame) {
        throw new Error("The collage canvas is not ready to export.");
      }
      const blob = await captureCloudImage(frame, {
        format,
        resolution,
      });
      downloadBlob(blob, saveImageFileName(cloudKind, format));
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
    downloadBlob(blob, saveJsonFileName(cloudKind));
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
          <Text type="supporting">Image</Text>
          <Text type="body" color="secondary">
            The exported image will contain everything you can see on the canvas, and the size and aspect ratio will stay the same.
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
              <SegmentedControlItem value="webp" label="WebP" />
            </SegmentedControl>
          </VStack>

          <RadioList
            label="Resolution"
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

        <VStack gap={3} width="100%">
          <Text type="supporting">JSON snapshot</Text>
          <Text type="body" color="secondary">
            {shareDoc
              ? `Flat list of the ${shareItemTypeLabel(cloudKind, listenCount)} currently in the cloud. Re-upload it in Create later — same format as Share.`
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

        {error ? (
          <Banner status="error" title={error} collapsible={false} />
        ) : null}
      </VStack>
    </UploadModal>
  );
}

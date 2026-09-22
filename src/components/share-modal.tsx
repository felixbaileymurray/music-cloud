"use client";

import { useEffect, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { FileJson, Link2 } from "lucide-react";
import { UploadModal } from "@/components/upload-modal";
import type { CloudKind } from "@/lib/types";
import {
  buildSharePageUrl,
  canBuildShareUrl,
  shareDocumentToJson,
  SHARE_FILE_NAME,
  SHARE_URL_MAX_ITEMS,
  shareItemTypeLabel,
  shareUrlLargeListDescription,
  type ShareDocumentV1,
} from "@/lib/share-payload";

export function ShareModal({
  open,
  document: shareDoc,
  cloudKind,
  onClose,
}: {
  open: boolean;
  document: ShareDocumentV1 | null;
  cloudKind: CloudKind;
  onClose: () => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [urlEligible, setUrlEligible] = useState(false);
  const [urlBusy, setUrlBusy] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !shareDoc) {
      setShareUrl(null);
      setUrlEligible(false);
      setCopyFeedback(null);
      return;
    }

    let cancelled = false;
    setUrlBusy(true);
    void (async () => {
      try {
        const eligible = await canBuildShareUrl(shareDoc);
        if (cancelled) return;
        setUrlEligible(eligible);
        if (eligible) {
          const url = await buildSharePageUrl(shareDoc);
          if (!cancelled) setShareUrl(url);
        } else {
          setShareUrl(null);
        }
      } finally {
        if (!cancelled) setUrlBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, shareDoc]);

  async function copyShareLink() {
    if (!shareUrl) return;
    setCopyFeedback(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback("Link copied.");
    } catch {
      setCopyFeedback("Could not copy. Select the link from your browser bar.");
    }
  }

  function downloadJson() {
    if (!shareDoc) return;
    const blob = new Blob([shareDocumentToJson(shareDoc)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = SHARE_FILE_NAME;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const urlDisabled = urlBusy || !urlEligible || !shareUrl;
  const visibleCount = shareDoc?.listens.length ?? 0;
  const showLargeListBanner =
    shareDoc != null && visibleCount > SHARE_URL_MAX_ITEMS;

  return (
    <UploadModal open={open} title="Share cloud" onClose={onClose}>
      {shareDoc ? (
        <VStack gap={5} width="100%">
          <VStack gap={2} width="100%">
            <Text type="body" color="secondary">
              Share this cloud ({shareItemTypeLabel(cloudKind, visibleCount)}).
              Only the visible items in the cloud will be shared.
            </Text>
            <Text type="body" color="secondary">
              No personal information is saved or shared, only details about the
              music.
            </Text>
          </VStack>

          {showLargeListBanner ? (
            <Banner
              status="info"
              title="Share links are unavailable for lists over 50 items"
              description={shareUrlLargeListDescription(visibleCount)}
              collapsible={false}
            />
          ) : null}

          <HStack gap={2} width="100%" wrap="wrap">
            <Button
              label="Copy share link"
              variant="primary"
              icon={<Icon icon={Link2} size="sm" />}
              isDisabled={urlDisabled}
              isLoading={urlBusy}
              onClick={() => void copyShareLink()}
            />
            <Button
              label="Download JSON"
              variant="secondary"
              icon={<Icon icon={FileJson} size="sm" />}
              onClick={downloadJson}
            />
          </HStack>

          {copyFeedback ? (
            <Text type="supporting" color="secondary">{copyFeedback}</Text>
          ) : null}
        </VStack>
      ) : null}
    </UploadModal>
  );
}

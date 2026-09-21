"use client";

import { useEffect, useMemo, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Download, Link2, Share2 } from "lucide-react";
import { UploadModal } from "@/components/upload-modal";
import {
  buildSharePageUrl,
  canBuildShareUrl,
  parseShareJson,
  shareDocumentToJson,
  SHARE_FILE_NAME,
  SHARE_URL_MAX_ITEMS,
  shareUrlItemLimitReason,
  type ShareDocumentV1,
} from "@/lib/share-payload";

export function ShareModal({
  open,
  document: shareDoc,
  onClose,
  onOpenShareDocument,
}: {
  open: boolean;
  document: ShareDocumentV1 | null;
  onClose: () => void;
  onOpenShareDocument: (doc: ShareDocumentV1) => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [urlEligible, setUrlEligible] = useState(false);
  const [urlBusy, setUrlBusy] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);

  const listenCount = shareDoc?.listens.length ?? 0;
  const itemLimitMessage = useMemo(
    () => (shareDoc ? shareUrlItemLimitReason(shareDoc.listens.length) : null),
    [shareDoc]
  );

  useEffect(() => {
    if (!open || !shareDoc) {
      setShareUrl(null);
      setUrlEligible(false);
      setCopyFeedback(null);
      setFileError(null);
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

  async function copyShareUrl() {
    if (!shareUrl) return;
    setCopyFeedback(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback("Link copied.");
    } catch {
      setCopyFeedback("Could not copy. Select the link from your browser bar.");
    }
  }

  async function nativeShare() {
    if (!shareUrl || !shareDoc) return;
    if (!navigator.share) {
      await copyShareUrl();
      return;
    }
    try {
      await navigator.share({
        title: "Music Cloud",
        text: `A ${shareDoc.kind} cloud (${shareDoc.listens.length} items)`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share failed — no error surface needed.
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

  async function openShareFile(files: FileList | File[]) {
    const list = Array.from(files);
    const file = list[0];
    if (!file) return;
    setFileBusy(true);
    setFileError(null);
    try {
      const doc = parseShareJson(await file.text());
      onOpenShareDocument(doc);
      onClose();
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : "Could not open that file."
      );
    } finally {
      setFileBusy(false);
    }
  }

  const urlDisabled = urlBusy || !urlEligible || !shareUrl;

  return (
    <UploadModal open={open} title="Share cloud" onClose={onClose}>
      <VStack gap={5} width="100%">
        {shareDoc ? (
          <Text type="body" color="secondary">
            Share a static snapshot of this cloud ({listenCount}{" "}
            {shareDoc.kind === "track" ? "tracks" : "albums"}). Recipients
            rebuild it like a manual import — no Spotify login required.
          </Text>
        ) : (
          <Text type="body" color="secondary">
            Create a cloud first to share it, or open a share file below.
          </Text>
        )}

        {shareDoc ? (
          <VStack gap={3} width="100%">
            {itemLimitMessage ? (
              <Banner
                status="info"
                title="Share link unavailable for large lists"
                description={itemLimitMessage}
                collapsible={false}
              />
            ) : (
              <Banner
                status="info"
                title={`Share links work for up to ${SHARE_URL_MAX_ITEMS} items`}
                description="The link embeds your list in the URL. Anyone with the link can open this cloud."
                collapsible={false}
              />
            )}

            <HStack gap={2} width="100%" wrap="wrap">
              <Button
                label="Copy share URL"
                variant="primary"
                icon={<Icon icon={Link2} size="sm" />}
                isDisabled={urlDisabled}
                isLoading={urlBusy}
                onClick={() => void copyShareUrl()}
              />
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <Button
                  label="Share…"
                  variant="secondary"
                  icon={<Icon icon={Share2} size="sm" />}
                  isDisabled={urlDisabled}
                  onClick={() => void nativeShare()}
                />
              ) : null}
              <Button
                label="Download JSON"
                variant="secondary"
                icon={<Icon icon={Download} size="sm" />}
                onClick={downloadJson}
              />
            </HStack>

            {copyFeedback ? (
              <Text type="supporting" color="secondary">{copyFeedback}</Text>
            ) : null}
          </VStack>
        ) : null}

        <VStack gap={3} width="100%">
          <Text type="supporting">Received a share file?</Text>
          <FileInput
            label="Open share file"
            mode="dropzone"
            accept=".json,application/json"
            value={null}
            onChange={() => {}}
            changeAction={async (next) => {
              const list = Array.isArray(next) ? next : next ? [next] : [];
              if (list.length) await openShareFile(list);
            }}
            isLoading={fileBusy}
            description="Use a music-cloud-share.json file from someone else."
            placeholder="Drop share JSON"
            width="100%"
          />
          {fileError ? (
            <Banner status="error" title={fileError} collapsible={false} />
          ) : null}
        </VStack>
      </VStack>
    </UploadModal>
  );
}

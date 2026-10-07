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
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Download, Images, Plus, Share2 } from "lucide-react";
import { CollageModeSwitch } from "@/components/collage/collage-mode-switch";
import {
  CollageShell,
  useCollageLayoutState,
} from "@/components/collage/collage-shell";
import { ImageIntake } from "@/components/images/image-intake";
import { PaperBackground } from "@/components/images/paper-background";
import {
  PaperLookPanel,
  paletteById,
} from "@/components/images/paper-look-panel";
import { SaveModal } from "@/components/save-modal";
import { UploadModal } from "@/components/upload-modal";
import type { CollageItem } from "@/lib/collage-item";
import { snapshotPaperBackground } from "@/lib/paper-capture";
import {
  PAPER_TEXTURE_DEFAULTS,
  type PaperTextureControls,
} from "@/lib/paper-presets";
import { defaultCloudSize } from "@/lib/share-payload";
import type { SaveResolutionPreset } from "@/lib/save-image";

type Phase = "idle" | "cloud";

type StoredImage = {
  id: string;
  objectUrl: string;
  label: string;
};

function filesToImages(files: File[]): StoredImage[] {
  return files.map((file, index) => ({
    id: `img-${file.name}-${file.size}-${file.lastModified}-${index}`,
    objectUrl: URL.createObjectURL(file),
    label: file.name || `Image ${index + 1}`,
  }));
}

export function ImagesCollage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [images, setImages] = useState<StoredImage[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportNeutral, setExportNeutral] = useState(false);
  const [createGate, setCreateGate] = useState<"warning" | "flow">("flow");
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [exploreResetToken, setExploreResetToken] = useState(0);
  const [paperEnabled, setPaperEnabled] = useState(
    PAPER_TEXTURE_DEFAULTS.enabled
  );
  const [paletteId, setPaletteId] = useState("white");
  const [paperControls, setPaperControls] = useState<PaperTextureControls>({
    blending: PAPER_TEXTURE_DEFAULTS.blending,
    seed: PAPER_TEXTURE_DEFAULTS.seed,
    roughness: PAPER_TEXTURE_DEFAULTS.roughness,
    wrinkles: PAPER_TEXTURE_DEFAULTS.wrinkles,
    drops: PAPER_TEXTURE_DEFAULTS.drops,
  });
  const cloudFrameRef = useRef<HTMLDivElement | null>(null);
  const paperRootRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const cloudSizeMax = Math.max(1, images.length);
  const layout = useCollageLayoutState(cloudSizeMax, { initialSizeRatio: 1 });

  const visible = useMemo(
    () =>
      images.slice(
        0,
        Math.max(1, Math.min(layout.cloudSize, images.length))
      ),
    [images, layout.cloudSize]
  );

  const visibleItems: CollageItem[] = useMemo(
    () =>
      visible.map((image) => ({
        id: image.id,
        imageUrl: image.objectUrl,
        label: image.label,
        weight: 1,
      })),
    [visible]
  );

  const hasCloud = phase === "cloud";
  const palette = paletteById(paletteId);

  function revokeObjectUrls(urls: string[]) {
    for (const url of urls) {
      URL.revokeObjectURL(url);
    }
  }

  function applyImages(next: StoredImage[]) {
    revokeObjectUrls(objectUrlsRef.current);
    objectUrlsRef.current = next.map((image) => image.objectUrl);
    setImages(next);
    setLockedId(null);
    setExploreResetToken((token) => token + 1);
    if (next.length === 0) {
      setPhase("idle");
      return;
    }
    layout.setCloudSize(defaultCloudSize(next.length));
    setPhase("cloud");
  }

  useEffect(() => {
    return () => {
      revokeObjectUrls(objectUrlsRef.current);
    };
  }, []);

  function openCreate() {
    if (hasCloud) {
      setCreateGate("warning");
    } else {
      setCreateGate("flow");
    }
    setUploadOpen(true);
  }

  function closeUpload() {
    setUploadOpen(false);
    setCreateGate("flow");
  }

  function confirmReplace() {
    setCreateGate("flow");
  }

  function onFilesSelected(files: File[]) {
    applyImages(filesToImages(files));
    setUploadOpen(false);
    setCreateGate("flow");
  }

  function lockItem(item: CollageItem) {
    setLockedId((current) => (current === item.id ? null : item.id));
  }

  function resetExplore() {
    setLockedId(null);
    setExploreResetToken((token) => token + 1);
  }

  function onCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!lockedId) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".cover-cloud__node")) {
      return;
    }
    resetExplore();
  }

  async function prepareNeutralCapture(resolution: SaveResolutionPreset = "medium") {
    setExportNeutral(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    const restorePaper = await snapshotPaperBackground(
      paperRootRef.current,
      resolution
    );
    return () => {
      restorePaper();
      setExportNeutral(false);
    };
  }

  const canvasOverlay = (
    <>
      {phase === "idle" ? (
        <div className="spa-empty">
          <VStack gap={4} width="100%" align="center">
            <VStack gap={2} width="100%" align="center">
              <Heading level={1} justify="center">
                Image collage
              </Heading>
              <Text type="body" color="secondary" justify="center">
                Arrange your photos on a paper canvas. Customise the background,
                then save a still image to share elsewhere.
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
    </>
  );

  return (
    <CollageShell
      modeSwitch={<CollageModeSwitch />}
      hasCloud={hasCloud}
      showCustomise={phase === "cloud"}
      sidebarActions={
        <VStack gap={2} width="100%">
          <Button
            label="Save"
            variant="primary"
            icon={<Icon icon={Download} size="sm" />}
            width="100%"
            onClick={() => setSaveOpen(true)}
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
              label="Share"
              variant="secondary"
              icon={<Icon icon={Share2} size="sm" />}
              onClick={() => setShareOpen(true)}
              width="100%"
            />
          </Grid>
        </VStack>
      }
      rightPanel={
        <PaperLookPanel
          enabled={paperEnabled}
          onEnabledChange={setPaperEnabled}
          paletteId={paletteId}
          onPaletteIdChange={setPaletteId}
          controls={paperControls}
          onControlsChange={(next) =>
            setPaperControls((current) => ({ ...current, ...next }))
          }
        />
      }
      rightPanelToggleIcon={Images}
      canvasOverlay={canvasOverlay}
      canvasBackground={
        hasCloud ? (
          <PaperBackground
            palette={palette}
            enabled={paperEnabled}
            controls={paperControls}
            rootRef={paperRootRef}
          />
        ) : null
      }
      visibleItems={visibleItems}
      lockedId={exportNeutral ? null : lockedId}
      neutralVisuals={exportNeutral}
      exploreResetToken={exploreResetToken}
      cloudFrameRef={cloudFrameRef}
      onHoverChange={() => {}}
      onLockToggle={lockItem}
      onCanvasPointerDown={onCanvasPointerDown}
      layout={layout}
      modals={
        <>
          <SaveModal
            open={saveOpen}
            featureLabel="images"
            document={null}
            showJsonBackup={false}
            getCloudFrame={() => cloudFrameRef.current}
            prepareNeutralCapture={prepareNeutralCapture}
            onClose={() => {
              setSaveOpen(false);
              setExportNeutral(false);
            }}
          />
          <UploadModal
            open={uploadOpen}
            dismissible
            onClose={closeUpload}
            title={
              createGate === "warning" ? "Replace current collage?" : "Add images"
            }
          >
            {createGate === "warning" ? (
              <VStack gap={4} width="100%">
                <Banner
                  status="warning"
                  title="Creating a new collage will overwrite the existing one."
                  description="Save your work first if you want to keep it."
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
                    label="Create anyway"
                    variant="primary"
                    width="100%"
                    onClick={confirmReplace}
                  />
                </Grid>
              </VStack>
            ) : (
              <ImageIntake onFilesSelected={onFilesSelected} />
            )}
          </UploadModal>
          <UploadModal
            open={shareOpen}
            title="Share"
            onClose={() => setShareOpen(false)}
          >
            <Text type="body" color="secondary">
              Sharing image collages from a link is not available yet. Use Save to
              download a still image you can post anywhere.
            </Text>
          </UploadModal>
        </>
      }
    />
  );
}

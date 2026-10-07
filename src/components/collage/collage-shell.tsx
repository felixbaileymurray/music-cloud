"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { StackItem } from "@astryxdesign/core/Stack";
import { VStack } from "@astryxdesign/core/VStack";
import { PanelRightClose, type LucideIcon } from "lucide-react";
import { AboutSection } from "@/components/about-section";
import { AppControlsButton } from "@/components/app-controls-modal";
import { BrandWordmark } from "@/components/brand-wordmark";
import { CollageKnob } from "@/components/collage/collage-knob";
import {
  DEFAULT_CLOUD_PHYSICS,
  DEFAULT_COLLISION_PAD,
  DEFAULT_COVER_FRAME,
  DEFAULT_SIZE_RATIO,
  DEFAULT_ZOOM,
  MAX_SIZE_RATIO,
  MAX_ZOOM,
  MIN_SIZE_RATIO,
  MIN_ZOOM,
} from "@/components/collage/collage-layout-constants";
import {
  CoverCloud,
  type CloudPhysics,
} from "@/components/cover-cloud";
import { useShowDevControls } from "@/lib/dev-controls-pref";
import type { CollageItem } from "@/lib/collage-item";
import "@/components/spa.css";

export type CollageLayoutState = {
  cloudSize: number;
  setCloudSize: (value: number) => void;
  cloudSizeMax: number;
  sizeRatio: number;
  setSizeRatio: (value: number) => void;
  zoom: number;
  setZoom: (value: number) => void;
  collisionPad: number;
  setCollisionPad: (value: number) => void;
  coverFrame: number;
  setCoverFrame: (value: number) => void;
  physics: CloudPhysics;
  setCenterStrengthBase: (value: number) => void;
  setCenterStrengthMass: (value: number) => void;
  setChargeStrength: (value: number) => void;
  setAlphaDecay: (value: number) => void;
  setCollideIterations: (value: number) => void;
  setCollideStrength: (value: number) => void;
  setHoverReheat: (value: number) => void;
  setBoundaryStrength: (value: number) => void;
};

export function useCollageLayoutState(
  cloudSizeMax: number,
  options?: { initialSizeRatio?: number }
): CollageLayoutState {
  const [cloudSize, setCloudSize] = useState(50);
  const [sizeRatio, setSizeRatio] = useState(
    options?.initialSizeRatio ?? DEFAULT_SIZE_RATIO
  );
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [collisionPad, setCollisionPad] = useState(DEFAULT_COLLISION_PAD);
  const [coverFrame, setCoverFrame] = useState(DEFAULT_COVER_FRAME);
  const [centerStrengthBase, setCenterStrengthBase] = useState(
    DEFAULT_CLOUD_PHYSICS.centerStrengthBase
  );
  const [centerStrengthMass, setCenterStrengthMass] = useState(
    DEFAULT_CLOUD_PHYSICS.centerStrengthMass
  );
  const [chargeStrength, setChargeStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.chargeStrength
  );
  const [alphaDecay, setAlphaDecay] = useState(DEFAULT_CLOUD_PHYSICS.alphaDecay);
  const [collideIterations, setCollideIterations] = useState(
    DEFAULT_CLOUD_PHYSICS.collideIterations
  );
  const [collideStrength, setCollideStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.collideStrength
  );
  const [hoverReheat, setHoverReheat] = useState(
    DEFAULT_CLOUD_PHYSICS.hoverReheat
  );
  const [boundaryStrength, setBoundaryStrength] = useState(
    DEFAULT_CLOUD_PHYSICS.boundaryStrength
  );

  const physics = useMemo<CloudPhysics>(
    () => ({
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      collideStrength,
      hoverReheat,
      boundaryStrength,
    }),
    [
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      collideStrength,
      hoverReheat,
      boundaryStrength,
    ]
  );

  return {
    cloudSize,
    setCloudSize,
    cloudSizeMax,
    sizeRatio,
    setSizeRatio,
    zoom,
    setZoom,
    collisionPad,
    setCollisionPad,
    coverFrame,
    setCoverFrame,
    physics,
    setCenterStrengthBase,
    setCenterStrengthMass,
    setChargeStrength,
    setAlphaDecay,
    setCollideIterations,
    setCollideStrength,
    setHoverReheat,
    setBoundaryStrength,
  };
}

export function CollageShell({
  modeSwitch,
  hasCloud,
  showCustomise,
  sidebarActions,
  rightPanel,
  rightPanelToggleIcon,
  /** When true, overlap + frame leave Dev Controls (shown in the feature right panel). */
  promoteVisualLayoutKnobs = false,
  canvasOverlay,
  canvasBackground,
  stageOverlay,
  visibleItems,
  lockedId,
  neutralVisuals,
  exploreResetToken,
  cloudFrameRef,
  onHoverChange,
  onLockToggle,
  onCanvasPointerDown,
  layout,
  modals,
}: {
  modeSwitch?: ReactNode;
  hasCloud: boolean;
  showCustomise: boolean;
  sidebarActions: ReactNode;
  rightPanel: ReactNode;
  rightPanelToggleIcon: LucideIcon;
  promoteVisualLayoutKnobs?: boolean;
  /** Status banners, empty states, resolve UI — rendered inside .spa-canvas */
  canvasOverlay: ReactNode;
  /** Behind the collage (e.g. paper texture). */
  canvasBackground?: ReactNode;
  /** Over the collage stage (e.g. audio unlock). */
  stageOverlay?: ReactNode;
  visibleItems: CollageItem[];
  lockedId: string | null;
  neutralVisuals: boolean;
  exploreResetToken: number;
  cloudFrameRef: React.RefObject<HTMLDivElement | null>;
  onHoverChange?: (item: CollageItem | null) => void;
  onLockToggle?: (item: CollageItem) => void;
  onCanvasPointerDown?: (
    event: import("react").PointerEvent<HTMLDivElement>
  ) => void;
  layout: CollageLayoutState;
  modals?: ReactNode;
}) {
  const [showDevControls] = useShowDevControls();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  useEffect(() => {
    setRightPanelOpen(hasCloud);
  }, [hasCloud]);

  const showCloud = hasCloud && visibleItems.length > 0;

  return (
    <div
      className="spa-shell"
      style={
        {
          "--cover-frame": `${layout.coverFrame}px`,
        } as CSSProperties
      }
    >
      <Layout
        height="fill"
        padding={0}
        start={
          <LayoutPanel
            width="var(--panel-width)"
            padding={0}
            isScrollable
            label="Cloud sidebar"
          >
            <Card width="100%" height="100%" padding={4}>
              <VStack gap={5} width="100%" height="100%">
                <BrandWordmark />
                {modeSwitch}

                {hasCloud ? sidebarActions : null}

                {showCustomise ? (
                  <VStack gap={8} width="100%" paddingBlockStart={2}>
                    <VStack gap={3} width="100%">
                      <Heading level={3}>Customise</Heading>
                      <CollageKnob
                        label="Size"
                        hint="How many items are shown. Defaults to 50 when more are available."
                        display={`${Math.min(layout.cloudSize, layout.cloudSizeMax)}`}
                        min={1}
                        max={layout.cloudSizeMax}
                        step={1}
                        value={Math.min(layout.cloudSize, layout.cloudSizeMax)}
                        onChange={layout.setCloudSize}
                      />
                      <CollageKnob
                        label="Size ratio"
                        hint="How much larger the biggest item is than the smallest."
                        display={`${layout.sizeRatio.toFixed(1)}×`}
                        min={MIN_SIZE_RATIO}
                        max={MAX_SIZE_RATIO}
                        step={0.1}
                        value={layout.sizeRatio}
                        onChange={layout.setSizeRatio}
                      />
                      <CollageKnob
                        label="Zoom"
                        hint="Scales the collage on the canvas. Zoom out for more breathing room."
                        display={`${Math.round(layout.zoom * 100)}%`}
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.05}
                        value={layout.zoom}
                        onChange={layout.setZoom}
                      />
                    </VStack>

                    {showDevControls ? (
                      <Collapsible
                        trigger={<Heading level={3}>Dev Controls</Heading>}
                        defaultIsOpen={false}
                      >
                        <VStack gap={3} width="100%" paddingBlockStart={3}>
                          {!promoteVisualLayoutKnobs ? (
                            <>
                              <CollageKnob
                                label="Overlap"
                                hint="Extra gap between items to reduce overlap."
                                display={`${layout.collisionPad}px`}
                                min={0}
                                max={24}
                                step={1}
                                value={layout.collisionPad}
                                onChange={layout.setCollisionPad}
                              />
                              <CollageKnob
                                label="Frame"
                                hint="Border thickness around each item. Visual only."
                                display={`${layout.coverFrame}px`}
                                min={0}
                                max={8}
                                step={1}
                                value={layout.coverFrame}
                                onChange={layout.setCoverFrame}
                              />
                            </>
                          ) : null}
                          <CollageKnob
                            label="Centre pull"
                            hint="How strongly every item is pulled toward the middle of the stage."
                            display={layout.physics.centerStrengthBase.toFixed(3)}
                            min={0}
                            max={0.12}
                            step={0.002}
                            value={layout.physics.centerStrengthBase}
                            onChange={layout.setCenterStrengthBase}
                          />
                          <CollageKnob
                            label="Mass pull"
                            hint="Extra centre pull for larger items, so heavier ones sit more centrally."
                            display={layout.physics.centerStrengthMass.toFixed(3)}
                            min={0}
                            max={0.4}
                            step={0.005}
                            value={layout.physics.centerStrengthMass}
                            onChange={layout.setCenterStrengthMass}
                          />
                          <CollageKnob
                            label="Charge"
                            hint="How strongly items push each other apart. More negative = more repulsion."
                            display={layout.physics.chargeStrength.toFixed(0)}
                            min={-40}
                            max={0}
                            step={1}
                            value={layout.physics.chargeStrength}
                            onChange={layout.setChargeStrength}
                          />
                          <CollageKnob
                            label="Settle speed"
                            hint="How quickly the simulation cools and items stop drifting."
                            display={layout.physics.alphaDecay.toFixed(3)}
                            min={0.005}
                            max={0.1}
                            step={0.001}
                            value={layout.physics.alphaDecay}
                            onChange={layout.setAlphaDecay}
                          />
                          <CollageKnob
                            label="Collide passes"
                            hint="How many times per frame overlaps are resolved. Higher is firmer, more CPU."
                            display={`${layout.physics.collideIterations}`}
                            min={1}
                            max={8}
                            step={1}
                            value={layout.physics.collideIterations}
                            onChange={layout.setCollideIterations}
                          />
                          <CollageKnob
                            label="Collide strength"
                            hint="How firmly overlapping items are shoved apart on each collide pass."
                            display={layout.physics.collideStrength.toFixed(2)}
                            min={0}
                            max={1}
                            step={0.05}
                            value={layout.physics.collideStrength}
                            onChange={layout.setCollideStrength}
                          />
                          <CollageKnob
                            label="Hover reheat"
                            hint="How strongly neighbours reflow when an item swells on hover."
                            display={layout.physics.hoverReheat.toFixed(2)}
                            min={0.05}
                            max={0.5}
                            step={0.01}
                            value={layout.physics.hoverReheat}
                            onChange={layout.setHoverReheat}
                          />
                          <CollageKnob
                            label="Boundary"
                            hint="How firmly items are nudged back inside the padded stage edges."
                            display={layout.physics.boundaryStrength.toFixed(2)}
                            min={0}
                            max={1.5}
                            step={0.05}
                            value={layout.physics.boundaryStrength}
                            onChange={layout.setBoundaryStrength}
                          />
                        </VStack>
                      </Collapsible>
                    ) : null}
                  </VStack>
                ) : null}

                <StackItem size="fill" />

                <HStack width="100%" justify="between" vAlign="center">
                  <AboutSection />
                  <AppControlsButton />
                </HStack>
              </VStack>
            </Card>
          </LayoutPanel>
        }
        end={
          rightPanelOpen ? (
            <LayoutPanel
              width="var(--panel-width)"
              padding={0}
              isScrollable
              label="Details sidebar"
            >
              <Card width="100%" height="100%" padding={4}>
                <VStack gap={4} width="100%" height="100%">
                  <HStack width="100%" justify="start">
                    <IconButton
                      label="Collapse details sidebar"
                      tooltip="Collapse sidebar"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRightPanelOpen(false)}
                      icon={<Icon icon={PanelRightClose} size="sm" />}
                    />
                  </HStack>
                  {rightPanel}
                </VStack>
              </Card>
            </LayoutPanel>
          ) : null
        }
      >
        <LayoutContent padding={0} isScrollable={false} label="Cloud canvas">
          <div className="spa-canvas">
            {canvasBackground}
            {!rightPanelOpen ? (
              <div className="spa-panel-toggle spa-panel-toggle--end">
                <IconButton
                  label="Expand details sidebar"
                  tooltip="Show details"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRightPanelOpen(true)}
                  icon={<Icon icon={rightPanelToggleIcon} size="sm" />}
                />
              </div>
            ) : null}

            {canvasOverlay}

            {showCloud ? (
              <div
                className="spa-cloud-stage"
                onPointerDown={onCanvasPointerDown}
              >
                {stageOverlay}
                <CoverCloud
                  items={visibleItems}
                  sizeRatio={layout.sizeRatio}
                  zoom={layout.zoom}
                  collisionPad={layout.collisionPad}
                  physics={layout.physics}
                  lockedId={neutralVisuals ? null : lockedId}
                  neutralVisuals={neutralVisuals}
                  frameRef={cloudFrameRef}
                  exploreResetToken={exploreResetToken}
                  onHoverChange={onHoverChange}
                  onLockToggle={onLockToggle}
                />
              </div>
            ) : null}
          </div>
        </LayoutContent>
      </Layout>

      {modals}
    </div>
  );
}

"use client";

import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipRef, PreviewHit } from "@/lib/types";
import { playSnippet, stopSnippet } from "@/lib/snippet-player";
import "@/components/spa.css";

type CloudNode = PreviewHit & {
  id: string;
  r: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

const SWELL = 1.18;
const MIN_RADIUS = 22;
/** Keep covers inset from the stage so the cloud never kisses the frame. */
const BOUNDARY_INSET = 40;

export type CloudPhysics = {
  centerStrengthBase: number;
  centerStrengthMass: number;
  chargeStrength: number;
  alphaDecay: number;
  collideIterations: number;
  boundaryStrength: number;
};

export const DEFAULT_CLOUD_PHYSICS: CloudPhysics = {
  centerStrengthBase: 0.02,
  centerStrengthMass: 0.3,
  chargeStrength: -10,
  alphaDecay: 0.08,
  collideIterations: 6,
  boundaryStrength: 1,
};

/**
 * Prefer listen counts when they vary. Otherwise fall back to list rank so
 * datasets without play counts still get a continuous size hierarchy.
 */
function sizeWeights(albums: PreviewHit[]): number[] {
  const counts = albums.map((album) => album.listenCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  if (maxCount > minCount) return counts;
  const n = albums.length;
  return albums.map((_, index) => n - index);
}

function radiusFor(
  weight: number,
  minWeight: number,
  maxWeight: number,
  sizeRatio: number
) {
  const ratio = Math.max(1, sizeRatio);
  const minR = MIN_RADIUS;
  const maxR = MIN_RADIUS * ratio;
  if (maxWeight === minWeight) return (minR + maxR) / 2;
  const t =
    (Math.sqrt(weight) - Math.sqrt(minWeight)) /
    (Math.sqrt(maxWeight) - Math.sqrt(minWeight));
  return minR + t * (maxR - minR);
}

function massNorm(r: number, minR: number, maxR: number) {
  if (maxR <= minR) return 0.5;
  return (r - minR) / (maxR - minR);
}

/** Soft wall: nudge covers that would spill past the padded stage edges. */
function forceBounds(
  width: number,
  height: number,
  boundaryStrength: number,
  getSwellId: () => string | null
) {
  let nodes: CloudNode[] = [];
  const force = (alpha: number) => {
    for (const node of nodes) {
      const swell = getSwellId() === node.id ? SWELL : 1;
      const r = node.r * swell + BOUNDARY_INSET;
      const minX = r;
      const maxX = Math.max(r, width - r);
      const minY = r;
      const maxY = Math.max(r, height - r);

      if (node.x < minX) {
        node.vx = (node.vx ?? 0) + (minX - node.x) * boundaryStrength * alpha;
      } else if (node.x > maxX) {
        node.vx = (node.vx ?? 0) + (maxX - node.x) * boundaryStrength * alpha;
      }

      if (node.y < minY) {
        node.vy = (node.vy ?? 0) + (minY - node.y) * boundaryStrength * alpha;
      } else if (node.y > maxY) {
        node.vy = (node.vy ?? 0) + (maxY - node.y) * boundaryStrength * alpha;
      }
    }
  };
  force.initialize = (initNodes: CloudNode[]) => {
    nodes = initNodes;
  };
  return force;
}

function clampNodeToBounds(
  node: CloudNode,
  width: number,
  height: number,
  hoveredId: string | null
) {
  const swell = hoveredId === node.id ? SWELL : 1;
  const r = node.r * swell + BOUNDARY_INSET;
  const maxX = Math.max(r, width - r);
  const maxY = Math.max(r, height - r);
  node.x = Math.max(r, Math.min(maxX, node.x ?? r));
  node.y = Math.max(r, Math.min(maxY, node.y ?? r));
}

export function CoverCloud({
  albums,
  audioUnlocked,
  sizeRatio = 4,
  collisionPad = 10,
  physics = DEFAULT_CLOUD_PHYSICS,
  lockedId = null,
  exploreResetToken = 0,
  onHoverChange,
  onLockToggle,
  onPreviewChange,
}: {
  albums: PreviewHit[];
  audioUnlocked: boolean;
  sizeRatio?: number;
  collisionPad?: number;
  physics?: CloudPhysics;
  lockedId?: string | null;
  exploreResetToken?: number;
  onHoverChange?: (album: PreviewHit | null) => void;
  onLockToggle?: (album: PreviewHit) => void;
  onPreviewChange?: (
    preview: { album: string; artist: string; clip: ClipRef } | null
  ) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<CloudNode, undefined> | null>(null);
  const cycleRef = useRef<Map<string, number>>(new Map());
  const hoverIdRef = useRef<string | null>(null);
  const lockedIdRef = useRef(lockedId);
  const collisionPadRef = useRef(collisionPad);
  const [nodes, setNodes] = useState<CloudNode[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  collisionPadRef.current = collisionPad;
  lockedIdRef.current = lockedId;

  const sized = useMemo(() => {
    if (albums.length === 0) return [];
    const weights = sizeWeights(albums);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    return albums.map((album, index) => ({
      ...album,
      id: `${album.artist}::${album.album}`,
      r: radiusFor(weights[index], minWeight, maxWeight, sizeRatio),
      x: size.width / 2,
      y: size.height / 2,
    }));
  }, [albums, size.height, size.width, sizeRatio]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(320, entry.contentRect.height),
      });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const pad = collisionPad;
    const {
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      boundaryStrength,
    } = physics;
    const radii = sized.map((node) => node.r);
    const minR = radii.length ? Math.min(...radii) : MIN_RADIUS;
    const maxR = radii.length ? Math.max(...radii) : MIN_RADIUS;
    const stage = Math.min(size.width, size.height);

    // Seed by mass: heavy covers near the centre, lighter ones further out.
    const seeded: CloudNode[] = sized.map((node, index) => {
      const angle = (index / Math.max(sized.length, 1)) * Math.PI * 2;
      const mass = massNorm(node.r, minR, maxR);
      const spread = stage * (0.06 + 0.32 * (1 - mass));
      const jitter = 0.55 + Math.random() * 0.45;
      return {
        ...node,
        x: cx + Math.cos(angle) * spread * jitter,
        y: cy + Math.sin(angle) * spread * jitter,
      };
    });

    const centerStrength = (node: CloudNode) =>
      centerStrengthBase + centerStrengthMass * massNorm(node.r, minR, maxR);

    const simulation = forceSimulation(seeded)
      .force("center", forceCenter(cx, cy))
      .force(
        "x",
        forceX(cx).strength((node) => centerStrength(node as CloudNode))
      )
      .force(
        "y",
        forceY(cy).strength((node) => centerStrength(node as CloudNode))
      )
      .force("charge", forceManyBody().strength(chargeStrength))
      .force(
        "collide",
        forceCollide<CloudNode>()
          .radius((node) => {
            const swell = hoverIdRef.current === node.id ? SWELL : 1;
            return node.r * swell + pad;
          })
          .iterations(collideIterations)
      )
      .force(
        "bounds",
        forceBounds(size.width, size.height, boundaryStrength, () => hoverIdRef.current)
      )
      .alpha(1)
      .alphaDecay(alphaDecay);

    simRef.current = simulation;
    simulation.on("tick", () => {
      for (const node of simulation.nodes()) {
        clampNodeToBounds(node, size.width, size.height, hoverIdRef.current);
      }
      setNodes(simulation.nodes().map((node) => ({ ...node })));
    });

    return () => {
      simulation.stop();
      simRef.current = null;
    };
  }, [sized, size.height, size.width, collisionPad, physics]);

  useEffect(() => {
    hoverIdRef.current = hoveredId;
    const simulation = simRef.current;
    if (!simulation) return;
    const collide = simulation.force("collide") as
      | ReturnType<typeof forceCollide<CloudNode>>
      | undefined;
    collide?.radius((node) => {
      const swell = hoverIdRef.current === node.id ? SWELL : 1;
      return node.r * swell + collisionPadRef.current;
    });
    simulation.alpha(0.35).restart();
  }, [hoveredId]);

  useEffect(() => {
    return () => {
      void stopSnippet();
    };
  }, []);

  useEffect(() => {
    if (exploreResetToken === 0) return;
    setHoveredId(null);
    onHoverChange?.(null);
    onPreviewChange?.(null);
    void stopSnippet();
  }, [exploreResetToken, onHoverChange, onPreviewChange]);

  function beginHover(node: CloudNode) {
    if (lockedIdRef.current && lockedIdRef.current !== node.id) return;

    setHoveredId(node.id);
    onHoverChange?.(node);
    if (!audioUnlocked || node.clips.length === 0) {
      onPreviewChange?.(null);
      return;
    }
    const next = cycleRef.current.get(node.id) ?? 0;
    const clip = node.clips[next % node.clips.length];
    cycleRef.current.set(node.id, next + 1);
    onPreviewChange?.({ album: node.album, artist: node.artist, clip });
    void playSnippet(clip);
  }

  function endHover(node: CloudNode) {
    if (hoverIdRef.current !== node.id) return;

    // Lock freezes the hover-away visual: keep focus/dimming, only stop audio.
    if (lockedIdRef.current) {
      onPreviewChange?.(null);
      void stopSnippet();
      return;
    }

    setHoveredId(null);
    onHoverChange?.(null);
    onPreviewChange?.(null);
    void stopSnippet();
  }

  return (
    <div ref={frameRef} className="cover-cloud">
      {nodes.map((node) => {
        const isHovered = hoveredId === node.id;
        const isLocked = lockedId === node.id;
        const emphasized = isHovered || isLocked;
        const dimmed =
          (hoveredId !== null || lockedId !== null) && !emphasized;
        // Keep swell while locked so leaving the cover doesn't "hover away".
        const displayR = node.r * (isHovered || isLocked ? SWELL : 1);
        return (
          <button
            key={node.id}
            type="button"
            aria-label={`${node.album} by ${node.artist}`}
            aria-pressed={isLocked}
            onPointerEnter={(event) => {
              if (event.pointerType === "touch") return;
              beginHover(node);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "touch") return;
              endHover(node);
            }}
            onPointerDown={(event) => {
              if (event.pointerType !== "touch") return;
              event.preventDefault();
              if (lockedIdRef.current && lockedIdRef.current !== node.id) {
                return;
              }
              if (hoveredId === node.id) {
                endHover(node);
              } else {
                if (hoveredId) void stopSnippet();
                beginHover(node);
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (lockedIdRef.current && lockedIdRef.current !== node.id) {
                return;
              }
              onLockToggle?.(node);
            }}
            className="cover-cloud__node"
            style={{
              left: (node.x ?? 0) - displayR,
              top: (node.y ?? 0) - displayR,
              width: displayR * 2,
              height: displayR * 2,
              opacity: dimmed ? 0.22 : 1,
              zIndex:
                isHovered || isLocked
                  ? "var(--z-dropdown)"
                  : "var(--z-base)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={node.coverUrl}
              draggable={false}
              className="cover-cloud__img"
            />
          </button>
        );
      })}
    </div>
  );
}

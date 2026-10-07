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
import { Icon } from "@astryxdesign/core/Icon";
import { Lock } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import type { CollageItem } from "@/lib/collage-item";
import "@/components/spa.css";

type CloudNode = CollageItem & {
  /** Half the geometric mean of the node’s sides (size scale from weight). */
  r: number;
  aspectRatio: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

const SWELL = 1.18;
const MIN_RADIUS = 22;
/** Keep items inset from the stage so the collage never kisses the frame. */
const BOUNDARY_INSET = 40;

/** Keep area ≈ (2r)² so weight sizing matches square covers when aspect is 1. */
export function nodeHalfExtents(r: number, aspectRatio: number) {
  const a = aspectRatio > 0 ? aspectRatio : 1;
  const halfH = r / Math.sqrt(a);
  const halfW = a * halfH;
  return { halfW, halfH };
}

export type CloudPhysics = {
  centerStrengthBase: number;
  centerStrengthMass: number;
  chargeStrength: number;
  alphaDecay: number;
  collideIterations: number;
  collideStrength: number;
  hoverReheat: number;
  boundaryStrength: number;
};

export const DEFAULT_CLOUD_PHYSICS: CloudPhysics = {
  centerStrengthBase: 0.02,
  centerStrengthMass: 0.3,
  chargeStrength: -10,
  alphaDecay: 0.08,
  collideIterations: 3,
  collideStrength: 0.7,
  hoverReheat: 0.2,
  boundaryStrength: 1,
};

function radiusFor(
  weight: number,
  minWeight: number,
  maxWeight: number,
  sizeRatio: number,
  zoom: number
) {
  const ratio = Math.max(1, sizeRatio);
  const scale = Math.max(0.1, zoom);
  const minR = MIN_RADIUS * scale;
  const maxR = MIN_RADIUS * ratio * scale;
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

/** Soft wall: nudge items that would spill past the padded stage edges. */
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
      const { halfW, halfH } = nodeHalfExtents(node.r * swell, node.aspectRatio);
      const padX = halfW + BOUNDARY_INSET;
      const padY = halfH + BOUNDARY_INSET;
      const minX = padX;
      const maxX = Math.max(padX, width - padX);
      const minY = padY;
      const maxY = Math.max(padY, height - padY);

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
  const { halfW, halfH } = nodeHalfExtents(node.r * swell, node.aspectRatio);
  const padX = halfW + BOUNDARY_INSET;
  const padY = halfH + BOUNDARY_INSET;
  const maxX = Math.max(padX, width - padX);
  const maxY = Math.max(padY, height - padY);
  node.x = Math.max(padX, Math.min(maxX, node.x ?? padX));
  node.y = Math.max(padY, Math.min(maxY, node.y ?? padY));
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else ref.current = value;
}

export function CoverCloud({
  items,
  sizeRatio = 4,
  zoom = 1,
  collisionPad = 10,
  physics = DEFAULT_CLOUD_PHYSICS,
  lockedId = null,
  exploreResetToken = 0,
  /** Strip hover swell, dimming, and lock emphasis for a clean export. */
  neutralVisuals = false,
  frameRef: frameRefProp,
  onHoverChange,
  onLockToggle,
}: {
  items: CollageItem[];
  sizeRatio?: number;
  /** Scales all items vs the canvas. 1 = current default. Lower = more breathing room. */
  zoom?: number;
  collisionPad?: number;
  physics?: CloudPhysics;
  lockedId?: string | null;
  exploreResetToken?: number;
  neutralVisuals?: boolean;
  frameRef?: Ref<HTMLDivElement | null>;
  onHoverChange?: (item: CollageItem | null) => void;
  onLockToggle?: (item: CollageItem) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<CloudNode, undefined> | null>(null);
  const hoverIdRef = useRef<string | null>(null);
  const lockedIdRef = useRef(lockedId);
  const collisionPadRef = useRef(collisionPad);
  const hoverReheatRef = useRef(physics.hoverReheat);
  const [nodes, setNodes] = useState<CloudNode[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  collisionPadRef.current = collisionPad * Math.max(0.1, zoom);
  hoverReheatRef.current = physics.hoverReheat;

  const sized = useMemo(() => {
    if (items.length === 0) return [];
    const weights = items.map((item) => item.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    return items.map((item) => ({
      ...item,
      aspectRatio:
        typeof item.aspectRatio === "number" && item.aspectRatio > 0
          ? item.aspectRatio
          : 1,
      r: radiusFor(item.weight, minWeight, maxWeight, sizeRatio, zoom),
      x: size.width / 2,
      y: size.height / 2,
    }));
  }, [items, size.height, size.width, sizeRatio, zoom]);

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
    const pad = collisionPad * Math.max(0.1, zoom);
    const {
      centerStrengthBase,
      centerStrengthMass,
      chargeStrength,
      alphaDecay,
      collideIterations,
      collideStrength,
      boundaryStrength,
    } = physics;
    const radii = sized.map((node) => node.r);
    const minR = radii.length ? Math.min(...radii) : MIN_RADIUS;
    const maxR = radii.length ? Math.max(...radii) : MIN_RADIUS;
    const stage = Math.min(size.width, size.height);

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
            // Same as pre-aspect: pad applies to size scale `r`, not rect circumradius.
            return node.r * swell + pad;
          })
          .strength(collideStrength)
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
  }, [sized, size.height, size.width, collisionPad, zoom, physics]);

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
    const alpha = Math.max(simulation.alpha(), hoverReheatRef.current);
    simulation.alpha(alpha).restart();
  }, [hoveredId]);

  useEffect(() => {
    lockedIdRef.current = lockedId;
  }, [lockedId]);

  useEffect(() => {
    if (exploreResetToken === 0) return;
    setHoveredId(null);
    hoverIdRef.current = null;
    onHoverChange?.(null);
  }, [exploreResetToken, onHoverChange]);

  function beginHover(node: CloudNode) {
    if (lockedIdRef.current && lockedIdRef.current !== node.id) return;

    hoverIdRef.current = node.id;
    setHoveredId(node.id);
    onHoverChange?.(node);
  }

  function endHover(node: CloudNode) {
    if (hoverIdRef.current !== node.id) return;

    if (lockedIdRef.current === node.id) {
      hoverIdRef.current = null;
      setHoveredId(null);
      onHoverChange?.(null);
      return;
    }

    hoverIdRef.current = null;
    setHoveredId(null);
    onHoverChange?.(null);
  }

  return (
    <div
      ref={(node) => {
        frameRef.current = node;
        assignRef(frameRefProp, node);
      }}
      className="cover-cloud"
    >
      {nodes.map((node) => {
        const isHovered = !neutralVisuals && hoveredId === node.id;
        const isLocked = !neutralVisuals && lockedId === node.id;
        const emphasized = isHovered || isLocked;
        const dimmed =
          !neutralVisuals &&
          (hoveredId !== null || lockedId !== null) &&
          !emphasized;
        const swell = isHovered || isLocked ? SWELL : 1;
        const { halfW, halfH } = nodeHalfExtents(node.r * swell, node.aspectRatio);
        return (
          <button
            key={node.id}
            type="button"
            aria-label={node.label}
            aria-pressed={isLocked}
            onPointerEnter={(event) => {
              if (neutralVisuals || event.pointerType === "touch") return;
              beginHover(node);
            }}
            onPointerLeave={(event) => {
              if (neutralVisuals || event.pointerType === "touch") return;
              endHover(node);
            }}
            onPointerDown={(event) => {
              if (neutralVisuals || event.pointerType !== "touch") return;
              event.preventDefault();
              if (lockedIdRef.current && lockedIdRef.current !== node.id) {
                return;
              }
              if (hoveredId === node.id) {
                endHover(node);
              } else {
                beginHover(node);
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (neutralVisuals) return;
              if (lockedIdRef.current && lockedIdRef.current !== node.id) {
                return;
              }
              onLockToggle?.(node);
            }}
            className="cover-cloud__node"
            style={{
              left: (node.x ?? 0) - halfW,
              top: (node.y ?? 0) - halfH,
              width: halfW * 2,
              height: halfH * 2,
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
              src={node.imageUrl}
              crossOrigin="anonymous"
              draggable={false}
              className="cover-cloud__img"
            />
            {isLocked ? (
              <span className="cover-cloud__lock-badge" aria-hidden="true">
                <Icon icon={Lock} size="xsm" color="secondary" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

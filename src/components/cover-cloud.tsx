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
import type { PreviewHit } from "@/lib/types";
import { playSnippet, stopSnippet } from "@/lib/snippet-player";

type CloudNode = PreviewHit & {
  id: string;
  r: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

const SWELL = 1.18;
const PAD = 3;

function radiusFor(count: number, minCount: number, maxCount: number) {
  const minR = 22;
  const maxR = 58;
  if (maxCount === minCount) return (minR + maxR) / 2;
  const t =
    (Math.sqrt(count) - Math.sqrt(minCount)) /
    (Math.sqrt(maxCount) - Math.sqrt(minCount));
  return minR + t * (maxR - minR);
}

export function CoverCloud({
  albums,
  audioUnlocked,
}: {
  albums: PreviewHit[];
  audioUnlocked: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<CloudNode, undefined> | null>(null);
  const cycleRef = useRef<Map<string, number>>(new Map());
  const hoverIdRef = useRef<string | null>(null);
  const [nodes, setNodes] = useState<CloudNode[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  const sized = useMemo(() => {
    if (albums.length === 0) return [];
    const counts = albums.map((album) => album.listenCount);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    return albums.map((album) => ({
      ...album,
      id: `${album.artist}::${album.album}`,
      r: radiusFor(album.listenCount, minCount, maxCount),
      x: size.width / 2,
      y: size.height / 2,
    }));
  }, [albums, size.height, size.width]);

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
    const seeded: CloudNode[] = sized.map((node, index) => {
      const angle = (index / Math.max(sized.length, 1)) * Math.PI * 2;
      const spread = Math.min(size.width, size.height) * 0.12;
      return {
        ...node,
        x: cx + Math.cos(angle) * spread * Math.random(),
        y: cy + Math.sin(angle) * spread * Math.random(),
      };
    });

    const simulation = forceSimulation(seeded)
      .force("center", forceCenter(cx, cy))
      .force("x", forceX(cx).strength(0.06))
      .force("y", forceY(cy).strength(0.06))
      .force("charge", forceManyBody().strength(-14))
      .force(
        "collide",
        forceCollide<CloudNode>()
          .radius((node) => {
            const swell = hoverIdRef.current === node.id ? SWELL : 1;
            return node.r * swell + PAD;
          })
          .iterations(4)
      )
      .alpha(1)
      .alphaDecay(0.03);

    simRef.current = simulation;
    simulation.on("tick", () => {
      setNodes(simulation.nodes().map((node) => ({ ...node })));
    });

    return () => {
      simulation.stop();
      simRef.current = null;
    };
  }, [sized, size.height, size.width]);

  useEffect(() => {
    hoverIdRef.current = hoveredId;
    const simulation = simRef.current;
    if (!simulation) return;
    const collide = simulation.force("collide") as
      | ReturnType<typeof forceCollide<CloudNode>>
      | undefined;
    collide?.radius((node) => {
      const swell = hoverIdRef.current === node.id ? SWELL : 1;
      return node.r * swell + PAD;
    });
    simulation.alpha(0.35).restart();
  }, [hoveredId]);

  useEffect(() => {
    return () => {
      void stopSnippet();
    };
  }, []);

  function beginHover(node: CloudNode) {
    setHoveredId(node.id);
    if (!audioUnlocked || node.previews.length === 0) return;
    const next = cycleRef.current.get(node.id) ?? 0;
    const url = node.previews[next % node.previews.length];
    cycleRef.current.set(node.id, next + 1);
    void playSnippet(url);
  }

  function endHover(node: CloudNode) {
    if (hoverIdRef.current === node.id) {
      setHoveredId(null);
      void stopSnippet();
    }
  }

  return (
    <div ref={frameRef} className="relative h-full min-h-[22rem] w-full overflow-hidden">
      {nodes.map((node) => {
        const active = hoveredId === node.id;
        const dimmed = hoveredId !== null && !active;
        const displayR = node.r * (active ? SWELL : 1);
        return (
          <button
            key={node.id}
            type="button"
            aria-label={`${node.album} by ${node.artist}`}
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
              if (hoveredId === node.id) {
                endHover(node);
              } else {
                if (hoveredId) void stopSnippet();
                beginHover(node);
              }
            }}
            className="absolute overflow-hidden rounded-md border border-white/10 bg-card p-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            style={{
              left: (node.x ?? 0) - displayR,
              top: (node.y ?? 0) - displayR,
              width: displayR * 2,
              height: displayR * 2,
              opacity: dimmed ? 0.22 : 1,
              zIndex: active ? 20 : 1,
              transition: "opacity 160ms linear",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={node.coverUrl}
              draggable={false}
              className="size-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}

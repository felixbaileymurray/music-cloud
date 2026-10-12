"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  hoverPreviewFromHit,
  type HoverPreview,
} from "@/lib/cloud-node";
import type { CollageItem } from "@/lib/collage-item";
import {
  playSnippet,
  prefetchSnippet,
  stopSnippet,
} from "@/lib/snippet-player";
import type { CloudHit, CloudKind } from "@/lib/types";

export function useMusicCloudAudio(
  cloudKind: CloudKind,
  hitsById: Map<string, CloudHit>,
  audioUnlocked: boolean,
  lockedId: string | null,
  hoveredId: string | null
) {
  const cycleRef = useRef<Map<string, number>>(new Map());
  const playingIdRef = useRef<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);

  const stillFocused = useCallback(
    (nodeId: string) => hoveredId === nodeId || lockedId === nodeId,
    [hoveredId, lockedId]
  );

  const playNextClip = useCallback(
    (nodeId: string, hit: CloudHit) => {
      if (!audioUnlocked || hit.clips.length === 0) {
        playingIdRef.current = null;
        setHoverPreview(null);
        return;
      }

      const next = cycleRef.current.get(nodeId) ?? 0;
      const clip = hit.clips[next % hit.clips.length];
      cycleRef.current.set(nodeId, next + 1);
      playingIdRef.current = nodeId;
      setHoverPreview(hoverPreviewFromHit(cloudKind, hit, clip));
      for (const other of hit.clips) {
        void prefetchSnippet(other);
      }
      void playSnippet(clip, {
        onEnded: () => {
          if (!stillFocused(nodeId)) {
            playingIdRef.current = null;
            return;
          }
          playNextClip(nodeId, hit);
        },
      });
    },
    [audioUnlocked, cloudKind, stillFocused]
  );

  const onItemHover = useCallback(
    (item: CollageItem | null) => {
      if (!item) {
        if (lockedId && playingIdRef.current === lockedId) {
          return;
        }
        playingIdRef.current = null;
        setHoverPreview(null);
        void stopSnippet();
        return;
      }

      const hit = hitsById.get(item.id);
      if (!hit) return;

      if (lockedId && lockedId !== item.id) return;

      if (playingIdRef.current === item.id) return;

      playNextClip(item.id, hit);
    },
    [hitsById, lockedId, playNextClip]
  );

  useEffect(() => {
    if (!lockedId && playingIdRef.current && hoveredId !== playingIdRef.current) {
      playingIdRef.current = null;
      setHoverPreview(null);
      void stopSnippet();
    }
  }, [lockedId, hoveredId]);

  useEffect(() => {
    return () => {
      playingIdRef.current = null;
      void stopSnippet();
    };
  }, []);

  function resetAudio() {
    playingIdRef.current = null;
    setHoverPreview(null);
    void stopSnippet();
  }

  return { hoverPreview, onItemHover, resetAudio };
}

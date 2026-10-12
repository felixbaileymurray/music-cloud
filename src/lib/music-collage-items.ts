import {
  cloudNodeId,
  cloudNodeLabel,
} from "@/lib/cloud-node";
import type { CollageItem } from "@/lib/collage-item";
import type { CloudHit, CloudKind } from "@/lib/types";

/**
 * Prefer listen counts when they vary. Otherwise fall back to list rank so
 * datasets without play counts still get a continuous size hierarchy.
 */
export function musicSizeWeights(hits: CloudHit[]): number[] {
  const counts = hits.map((item) => item.listenCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  if (maxCount > minCount) return counts;
  const n = hits.length;
  return hits.map((_, index) => n - index);
}

export function hitsToCollageItems(
  kind: CloudKind,
  hits: CloudHit[]
): CollageItem[] {
  const weights = musicSizeWeights(hits);
  return hits.map((hit, index) => ({
    id: cloudNodeId(kind, hit),
    imageUrl: hit.coverUrl,
    label: cloudNodeLabel(kind, hit),
    weight: weights[index],
  }));
}

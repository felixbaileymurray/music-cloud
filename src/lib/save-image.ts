import { toBlob, toJpeg, toPng } from "html-to-image";
import type { CloudKind } from "@/lib/types";

export type SaveImageFormat = "png" | "jpeg" | "webp";
export type SaveResolutionPreset = "low" | "medium" | "high";

/** CSS-pixel multipliers for export resolution (same for every format). */
export const RESOLUTION_SCALE: Record<SaveResolutionPreset, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Fixed lossy encoder quality — resolution is the user-facing quality lever. */
const LOSSY_QUALITY = 0.92;

const FORMAT_EXT: Record<SaveImageFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

export function saveImageFileName(
  kind: CloudKind,
  format: SaveImageFormat,
  date = new Date()
) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `music-cloud-${kind}-${yyyy}-${mm}-${dd}.${FORMAT_EXT[format]}`;
}

export function saveJsonFileName(kind: CloudKind, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `music-cloud-${kind}-${yyyy}-${mm}-${dd}.json`;
}

function canvasBackgroundColor(node: HTMLElement): string {
  const stage = node.closest(".spa-canvas") ?? node.parentElement ?? node;
  const color = getComputedStyle(stage).backgroundColor;
  if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
    return color;
  }
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-background-body")
      .trim() || "#ffffff"
  );
}

export async function captureCloudImage(
  node: HTMLElement,
  options: {
    format: SaveImageFormat;
    resolution: SaveResolutionPreset;
  }
): Promise<Blob> {
  const pixelRatio = RESOLUTION_SCALE[options.resolution];
  const backgroundColor = canvasBackgroundColor(node);
  const shared = {
    pixelRatio,
    backgroundColor,
    cacheBust: true,
    // Skip focus rings / Astryx chrome that can appear in clones.
    filter: (domNode: HTMLElement) => {
      if (domNode.tagName === "SCRIPT") return false;
      return true;
    },
  };

  let blob: Blob | null = null;

  if (options.format === "png") {
    const dataUrl = await toPng(node, shared);
    blob = await (await fetch(dataUrl)).blob();
  } else if (options.format === "jpeg") {
    const dataUrl = await toJpeg(node, {
      ...shared,
      quality: LOSSY_QUALITY,
    });
    blob = await (await fetch(dataUrl)).blob();
  } else {
    blob = await toBlob(node, {
      ...shared,
      type: "image/webp",
      quality: LOSSY_QUALITY,
    });
  }

  if (!blob?.size) {
    throw new Error(
      options.format === "webp"
        ? "WebP export is not supported in this browser."
        : "Image export produced an empty file."
    );
  }
  return blob;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

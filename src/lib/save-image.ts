import { toJpeg, toPng } from "html-to-image";
import type { CloudKind } from "@/lib/types";

export type SaveImageFormat = "png" | "jpeg";
export type SaveQualityPreset = "low" | "medium" | "high";

/** CSS-pixel multipliers for export resolution. */
export const RESOLUTION_SCALE: Record<SaveQualityPreset, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** JPEG encoder quality (0–1). */
export const JPEG_QUALITY: Record<SaveQualityPreset, number> = {
  low: 0.6,
  medium: 0.82,
  high: 0.92,
};

export function saveImageFileName(
  kind: CloudKind,
  format: SaveImageFormat,
  date = new Date()
) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const ext = format === "png" ? "png" : "jpg";
  return `music-cloud-${kind}-${yyyy}-${mm}-${dd}.${ext}`;
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
    resolution: SaveQualityPreset;
    jpegQuality: SaveQualityPreset;
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

  const dataUrl =
    options.format === "png"
      ? await toPng(node, shared)
      : await toJpeg(node, {
          ...shared,
          quality: JPEG_QUALITY[options.jpegQuality],
        });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("Image export produced an empty file.");
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

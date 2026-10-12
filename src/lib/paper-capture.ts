import { RESOLUTION_SCALE, type SaveResolutionPreset } from "@/lib/save-image";

/**
 * Replaces a WebGL paper canvas with a bitmap so html-to-image can export it.
 * Returns a restore function.
 */
export async function snapshotPaperBackground(
  paperRoot: HTMLElement | null,
  resolution: SaveResolutionPreset
): Promise<() => void> {
  if (!paperRoot) return () => {};

  const canvas = paperRoot.querySelector("canvas");
  if (!canvas) return () => {};

  const pixelRatio = RESOLUTION_SCALE[resolution];
  const width = Math.round(canvas.clientWidth * pixelRatio);
  const height = Math.round(canvas.clientHeight * pixelRatio);

  const snapshot = document.createElement("canvas");
  snapshot.width = width;
  snapshot.height = height;
  const ctx = snapshot.getContext("2d");
  if (!ctx) return () => {};

  ctx.drawImage(canvas, 0, 0, width, height);

  const img = document.createElement("img");
  img.src = snapshot.toDataURL("image/png");
  img.alt = "";
  img.className = "spa-paper-capture";
  img.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;";

  canvas.style.visibility = "hidden";
  paperRoot.appendChild(img);

  return () => {
    img.remove();
    canvas.style.visibility = "";
  };
}

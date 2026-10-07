"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { PAPER_TEXTURE_FIXED } from "@/lib/paper-presets";
import type { PaperPalette } from "@/lib/paper-presets";

const PaperTexture = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => mod.PaperTexture),
  { ssr: false }
);

export function PaperBackground({
  palette,
  roughness,
  rootRef,
}: {
  palette: PaperPalette;
  roughness: number;
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={rootRef} className="spa-paper-bg" aria-hidden="true">
      <PaperTexture
        width="100%"
        height="100%"
        colorBack={palette.colorBack}
        colorPaper={palette.colorPaper}
        colorShadow={palette.colorShadow}
        roughness={roughness}
        roughnessSize={0.45}
        roughnessRows={0}
        {...PAPER_TEXTURE_FIXED}
      />
    </div>
  );
}

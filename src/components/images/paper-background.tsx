"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import {
  PAPER_TEXTURE_FIXED,
  type PaperPalette,
  type PaperTextureControls,
} from "@/lib/paper-presets";

const PaperTexture = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => mod.PaperTexture),
  { ssr: false }
);

export function PaperBackground({
  palette,
  enabled,
  controls,
  rootRef,
}: {
  palette: PaperPalette;
  enabled: boolean;
  controls: PaperTextureControls;
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={rootRef}
      className="spa-paper-bg"
      aria-hidden="true"
      data-paper-enabled={enabled ? "true" : "false"}
      style={{ background: palette.colorPaper }}
    >
      {enabled ? (
        <PaperTexture
          width="100%"
          height="100%"
          colorBack={palette.colorPaper}
          colorPaper={palette.colorPaper}
          colorShadow={palette.colorShadow}
          seed={controls.seed}
          roughness={controls.roughness}
          wrinkles={controls.wrinkles}
          drops={controls.drops}
          {...PAPER_TEXTURE_FIXED}
        />
      ) : null}
    </div>
  );
}

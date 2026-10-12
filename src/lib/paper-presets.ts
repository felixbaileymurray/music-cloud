export type PaperPalette = {
  id: string;
  label: string;
  /** Flat canvas / paper sheet colour (also used for cover frames). */
  colorPaper: string;
  /** Baked shadow tone for the texture shader — not exposed in the UI. */
  colorShadow: string;
};

/** Riso-style paper stocks: solid swatches, shadows baked for the shader. */
export const PAPER_PALETTES: PaperPalette[] = [
  {
    id: "white",
    label: "White",
    colorPaper: "#ffffff",
    colorShadow: "#c8c8c8",
  },
  {
    id: "warm-white",
    label: "Warm white",
    colorPaper: "#f5f0e6",
    colorShadow: "#c9b89a",
  },
  {
    id: "grey",
    label: "Grey",
    colorPaper: "#e4e4e0",
    colorShadow: "#a3a39e",
  },
  {
    id: "light-blue",
    label: "Light blue",
    colorPaper: "#d6e4f0",
    colorShadow: "#8fa8bc",
  },
  {
    id: "dark",
    label: "Dark",
    colorPaper: "#2a2a2e",
    colorShadow: "#0d0d10",
  },
];

/** Default values for paper texture knobs exposed in the canvas sidebar. */
export const PAPER_TEXTURE_DEFAULTS: {
  enabled: boolean;
  seed: number;
  roughness: number;
  wrinkles: number;
  drops: number;
} = {
  enabled: true,
  seed: 190,
  roughness: 0.33,
  wrinkles: 0.3,
  drops: 0.3,
};

/** Fixed paper texture params — not exposed in the UI. */
export const PAPER_TEXTURE_FIXED = {
  /** Flat sheet colour is the canvas; blending only mixes texture, not a second tone. */
  blending: 0.5,
  distortion: 0,
  angle: 300,
  fiber: 0.15,
  fiberSize: 0.5,
  folds: 0,
  crumples: 0,
  scale: 1,
  fit: "cover" as const,
  roughnessSize: 0.45,
  roughnessRows: 0,
};

export type PaperTextureControls = {
  seed: number;
  roughness: number;
  wrinkles: number;
  drops: number;
};

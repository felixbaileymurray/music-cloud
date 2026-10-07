export type PaperPalette = {
  id: string;
  label: string;
  colorPaper: string;
  colorShadow: string;
  colorBack: string;
};

export const PAPER_PALETTES: PaperPalette[] = [
  {
    id: "white",
    label: "White",
    colorPaper: "#ffffff",
    colorShadow: "#cccccc",
    colorBack: "#f0f0f0",
  },
  {
    id: "warm-white",
    label: "Warm white",
    colorPaper: "#f5f0e6",
    colorShadow: "#c9b89a",
    colorBack: "#e8dfd0",
  },
  {
    id: "cream",
    label: "Cream",
    colorPaper: "#faf6e8",
    colorShadow: "#d4c9a8",
    colorBack: "#ebe4cc",
  },
  {
    id: "cool-grey",
    label: "Cool grey",
    colorPaper: "#eceef0",
    colorShadow: "#a8adb4",
    colorBack: "#d8dce0",
  },
  {
    id: "ink",
    label: "Ink",
    colorPaper: "#2a2a2e",
    colorShadow: "#0d0d10",
    colorBack: "#1b1b1f",
  },
];

/** Default values for paper texture knobs exposed in the canvas sidebar. */
export const PAPER_TEXTURE_DEFAULTS: {
  enabled: boolean;
  blending: number;
  seed: number;
  roughness: number;
  wrinkles: number;
  drops: number;
} = {
  enabled: true,
  blending: 0.5,
  seed: 190,
  roughness: 0.33,
  wrinkles: 0.3,
  drops: 0.3,
};

/** Fixed paper texture params — not exposed in the UI. */
export const PAPER_TEXTURE_FIXED = {
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
  blending: number;
  seed: number;
  roughness: number;
  wrinkles: number;
  drops: number;
};

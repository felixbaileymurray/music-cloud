export type PaperPalette = {
  id: string;
  label: string;
  colorPaper: string;
  colorShadow: string;
  colorBack: string;
};

export const PAPER_PALETTES: PaperPalette[] = [
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

/** Fixed quiet paper texture — not exposed in the UI. */
export const PAPER_TEXTURE_FIXED = {
  blending: 0,
  distortion: 0,
  angle: 300,
  seed: 4,
  fiber: 0.15,
  fiberSize: 0.5,
  folds: 0,
  wrinkles: 0,
  crumples: 0,
  drops: 0,
  scale: 1,
  fit: "cover" as const,
};

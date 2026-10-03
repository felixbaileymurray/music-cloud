import { defineTheme } from "@astryxdesign/core/theme";
import {
  neutralIconRegistry,
  neutralTheme,
} from "@astryxdesign/theme-neutral";

const systemSans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * Neutral, with Bricola type only.
 * Families resolve through next/font variables on <html> (see src/lib/fonts.ts).
 * Scale matches Neutral so heading.weight is applied without changing sizes.
 */
export const bricolaTheme = defineTheme({
  name: "bricola",
  extends: neutralTheme,
  icons: neutralIconRegistry,
  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: "var(--font-bricola-body)",
      fallbacks: systemSans,
    },
    heading: {
      family: "var(--font-bricola-heading)",
      fallbacks: systemSans,
      weight: "bold",
    },
    code: {
      family: "var(--font-bricola-body)",
      fallbacks: systemSans,
    },
  },
});

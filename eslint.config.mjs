import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { astryxInterimConfig } from "./eslint.astryx-interim.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  astryxInterimConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/theme/bricola.js",
    "src/theme/bricola.d.ts",
    "src/theme/bricola.variants.d.ts",
  ]),
]);

export default eslintConfig;

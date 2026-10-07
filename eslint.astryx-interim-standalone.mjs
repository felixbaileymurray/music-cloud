/**
 * Standalone ESLint config for CI: interim Astryx rules only (no Next/React hooks suite).
 * See docs/astryx-ci.md — replace with official eslint-plugin-astryx when available.
 */
import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import { astryxInterimConfig } from "./eslint.astryx-interim.mjs";

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
  },
  astryxInterimConfig,
]);

/**
 * Interim Astryx-oriented ESLint overrides until Meta ships eslint-plugin-astryx.
 * Policy: docs/astryx-ci.md — remove this file when the official plugin is adopted.
 */
export const astryxInterimConfig = {
  files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
  ignores: [
    // Force-graph / SPA canvas shells (not Astryx layout surfaces).
    "src/components/cloud-app.tsx",
    "src/components/cover-cloud.tsx",
    // Legacy shadcn copies; migrate or delete separately.
    "src/components/ui/**",
  ],
  rules: {
    "no-restricted-syntax": [
      "warn",
      {
        selector:
          "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
        message:
          "Prefer Astryx component props or token-backed utilities over inline style={{…}} (see AGENTS.md).",
      },
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\[[^\\]]+\\]/]",
        message:
          "Avoid arbitrary Tailwind values (e.g. p-[13px]); use design tokens via tailwind-theme.css.",
      },
    ],
  },
};

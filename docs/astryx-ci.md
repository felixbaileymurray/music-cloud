# Astryx CI

GitHub Actions for **Astryx setup**, theme artifacts, interim ESLint, and optional **design-system advisory review** on pull requests to `dev`.

General **code review** (bugs, security, maintainability) is a separate portable pack: [`docs/code-review-ci.md`](code-review-ci.md) and [`scripts/code-review/`](../scripts/code-review/).

## Required checks (Layer 1)

Workflow: [`.github/workflows/astryx-check.yml`](../.github/workflows/astryx-check.yml)

| Step | Command | Purpose |
|------|---------|---------|
| Doctor | `astryx doctor` | Node version, core/cli alignment, theme wiring, agent docs, peers |
| Theme | `npm run theme:check` | Generated theme CSS/types match `bricolaTheme.ts` |
| Interim Astryx lint | `npm run lint:astryx-interim` | Interim design-system warnings only (see below) |
| Build | `npm run build` | App compiles |

Local equivalent:

```bash
npm run astryx:check
npm run lint:astryx-interim
npm run build
npm run lint
```

Full `npm run lint` (Next.js + TypeScript rules) is still recommended locally; the GitHub job does not gate on it until existing lint debt is cleared.

## Astryx advisory review

Workflow: [`.github/workflows/astryx-advisory-review.yml`](../.github/workflows/astryx-advisory-review.yml)

Script: [`scripts/astryx-advisory/review.mjs`](../scripts/astryx-advisory/review.mjs). Marker: `astryx-advisory-review:v1`.

Runs **once per PR** when reviewable (same trigger pattern as [code review](code-review-ci.md#when-it-runs)), only when paths under `src/app`, `src/components`, or `AGENTS.md` change. Posts a **separate** PR comment from general code review.

1. Diffs UI paths against the base branch.
2. Pulls Astryx component and topic docs via the CLI.
3. Calls an LLM with AGENTS.md rules and the diff.
4. Skips if an Astryx review comment already exists (unless **force** manual re-run).

Secrets: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Optional variable: `ASTRYX_REVIEW_MODEL`.

Non-blocking; not Cursor Bugbot.

## Interim ESLint (until official plugin)

Meta’s `eslint-plugin-astryx` is not published on npm yet. Until it is, [`eslint.astryx-interim.mjs`](../eslint.astryx-interim.mjs) adds **warnings** for:

- inline `style={{…}}` on JSX in app UI files
- arbitrary Tailwind literals in `className` (e.g. `p-[13px]`)

Canvas shells (`cloud-app.tsx`, `cover-cloud.tsx`) and `src/components/ui/**` are excluded.

**When `@astryxdesign/eslint-plugin` (or equivalent) ships:** remove `eslint.astryx-interim.mjs`, drop its import from `eslint.config.mjs`, and adopt the official plugin config instead. Do not extend the interim rules further.

## Branch protection

On `dev`, require the **Astryx checks** workflow (or its job name) before merge. Advisory reviews (Astryx and general code) should stay optional.

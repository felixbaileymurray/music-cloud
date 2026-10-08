# Astryx CI

GitHub Actions for **Astryx setup**, theme artifacts, interim ESLint, and an optional **Design System Reviewer** on pull requests.

**General bug review** is [Cursor Bugbot](code-review-ci.md), configured in the Cursor dashboard.

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

## Design System Reviewer

Workflow: [`.github/workflows/astryx-advisory-review.yml`](../.github/workflows/astryx-advisory-review.yml)

Script: [`scripts/astryx-advisory/review.mjs`](../scripts/astryx-advisory/review.mjs). Marker: `astryx-advisory-review:v1`.

The check is listed on reviewable pull requests (`opened`, `synchronize`, `ready_for_review`, `reopened`) except those into `main`. The model runs only when `src/app` or `src/components` TypeScript files change, and only once per PR unless a manual **force** re-run is used. Later pushes still show the check and skip the model if that comment already exists. No UI changes: the check passes without a comment. Posts a **summary PR comment** (not inline threads).

Secrets: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Optional variable: `ASTRYX_REVIEW_MODEL`.

Complements [Bugbot](code-review-ci.md); does not replace it.

## Interim ESLint (until official plugin)

Meta’s `eslint-plugin-astryx` is not published on npm yet. Until it is, [`eslint.astryx-interim.mjs`](../eslint.astryx-interim.mjs) adds **warnings** for:

- inline `style={{…}}` on JSX in app UI files
- arbitrary Tailwind literals in `className` (e.g. `p-[13px]`)

Canvas shells (`cloud-app.tsx`, `cover-cloud.tsx`) and `src/components/ui/**` are excluded.

**When `@astryxdesign/eslint-plugin` (or equivalent) ships:** remove `eslint.astryx-interim.mjs`, drop its import from `eslint.config.mjs`, and adopt the official plugin config instead. Do not extend the interim rules further.

## Branch protection

On `dev`, require the **Astryx Checks** workflow before merge. Design System Reviewer should stay optional.

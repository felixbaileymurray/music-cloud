# Astryx CI and advisory review

GitHub Actions enforce Astryx **setup and theme artifacts** on pull requests to `dev`. A separate workflow posts an **advisory** design-system review on PRs that touch UI code.

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

## Advisory reviews (Layer 3)

Two **non-blocking** workflows run when a PR to `dev` is opened or updated (including the first push after **Ready for review**). Each posts its **own** PR comment and job summary. Draft PRs are skipped.

| Review | Workflow | Scope |
|--------|----------|--------|
| **General code** | [`.github/workflows/code-review-advisory.yml`](../.github/workflows/code-review-advisory.yml) | Whole PR diff (bugs, security, perf, maintainability) |
| **Astryx design system** | [`.github/workflows/astryx-advisory-review.yml`](../.github/workflows/astryx-advisory-review.yml) | UI paths + Astryx CLI docs |

Implementation is **provider-agnostic** (Anthropic Messages API or OpenAI Chat Completions), not `anthropics/claude-code-action`. The general review prompt is aligned with Claude Code’s `/code-review` intent; swap models via secrets and `CODE_REVIEW_MODEL` without changing workflows.

### General code review

Script: [`scripts/code-review-advisory.mjs`](../scripts/code-review-advisory.mjs). Marker: `code-review-advisory:v1`.

Does **not** duplicate Astryx feedback (design-system comments are left to the Astryx job).

### Astryx design-system review

Workflow: [`.github/workflows/astryx-advisory-review.yml`](../.github/workflows/astryx-advisory-review.yml)

On PRs that change `src/app/**` or `src/components/**`, the job:

1. Diffs the PR against the base branch.
2. Pulls Astryx component and topic docs via the CLI for symbols seen in the diff.
3. Calls an LLM with AGENTS.md rules and the diff.
4. **Creates or updates one PR comment** (marker `astryx-advisory-review:v1`).
5. Mirrors the comment in the Actions job summary.

This does **not** block merge. It is not Cursor Bugbot; it runs entirely in GitHub Actions.

### Repository secrets

Configure **one** of:

| Secret | Use |
|--------|-----|
| `ANTHROPIC_API_KEY` | Preferred if you use Claude |
| `OPENAI_API_KEY` | Alternative (default model `gpt-4o-mini`) |

Optional repository variables:

| Variable | Use |
|----------|-----|
| `CODE_REVIEW_MODEL` | Model id for general code review (preferred) |
| `ASTRYX_REVIEW_MODEL` | Model id for Astryx advisory (falls back for code review if unset) |

If neither secret is set, the workflow still succeeds and the PR comment explains that review was skipped.

Draft PRs skip advisory review until marked ready for review.

## Interim ESLint (until official plugin)

Meta’s `eslint-plugin-astryx` is not published on npm yet. Until it is, [`eslint.astryx-interim.mjs`](../eslint.astryx-interim.mjs) adds **warnings** for:

- inline `style={{…}}` on JSX in app UI files
- arbitrary Tailwind literals in `className` (e.g. `p-[13px]`)

Canvas shells (`cloud-app.tsx`, `cover-cloud.tsx`) and `src/components/ui/**` are excluded.

**When `@astryxdesign/eslint-plugin` (or equivalent) ships:** remove `eslint.astryx-interim.mjs`, drop its import from `eslint.config.mjs`, and adopt the official plugin config instead. Do not extend the interim rules further.

## Branch protection

On `dev`, require the **Astryx checks** workflow (or its job name) before merge. Advisory review should stay optional.

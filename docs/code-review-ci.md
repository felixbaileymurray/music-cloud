# Advisory code review (GitHub)

Portable **general** pull request review: one LLM pass when a PR becomes reviewable, one PR comment, no merge gate.

Implementation: [`scripts/code-review/`](../scripts/code-review/) (copy that folder + the workflow to other repos).

Workflow: [`.github/workflows/code-review-advisory.yml`](../.github/workflows/code-review-advisory.yml)

## When it runs

| Event | Behavior |
|-------|----------|
| **Draft PR** | Skipped while `draft: true` |
| **Ready for review** | Runs when the PR leaves draft |
| **Open PR (not draft)** | Runs on `opened` |
| **Later commits** | No automatic re-review (cost control) |

Manual re-run: Actions → **Code review (advisory)** → Run workflow → PR number → optional **force** (replaces the existing comment).

## Secrets and variables

| Name | Kind | Purpose |
|------|------|---------|
| `ANTHROPIC_API_KEY` | Secret | Claude (preferred if you use Anthropic) |
| `OPENAI_API_KEY` | Secret | Alternative provider |
| `CODE_REVIEW_MODEL` | Variable | Model id for this job |
| `CODE_REVIEW_PROJECT_LABEL` | Variable | Shown in the prompt (this repo: `Bricola`) |
| `CODE_REVIEW_CONTEXT_FILES` | Variable | Comma-separated paths for extra context |
| `CODE_REVIEW_EXCLUDE_TOPICS` | Variable | Instruct the model to skip topics handled elsewhere |

This repo sets `CODE_REVIEW_EXCLUDE_TOPICS` so **Astryx / design-system** feedback stays in the separate [Astryx advisory](astryx-ci.md#astryx-advisory-review) workflow.

## Local

```bash
npm run code-review:advisory -- --dry-run
# or
BASE=origin/dev HEAD=HEAD node scripts/code-review/advisory.mjs --dry-run
```

## Relation to Astryx

| Piece | Scope |
|-------|--------|
| **Code review** (this doc) | Any stack; lives in `scripts/code-review/` |
| **Astryx checks + advisory** | [`docs/astryx-ci.md`](astryx-ci.md) — doctor, theme, interim ESLint, design-system bot |

The code-review workflow does **not** run `npm ci`; only Node and git are required. The Astryx advisory workflow installs dependencies for the CLI.

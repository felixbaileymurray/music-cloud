# Advisory PR code review

Self-contained **general** pull request review for GitHub Actions. No npm dependencies beyond Node 22+ (uses `fetch` and git).

Review criteria are adapted from Anthropic's Claude Code [code-review command](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md) (high-signal bugs + agent-doc compliance). See [`prompt-anthropic.mjs`](prompt-anthropic.mjs). We do **not** run the full plugin (parallel agents, confidence subagents, inline MCP comments).

Copy into any repository:

1. This directory: `scripts/code-review/`
2. Workflow: [`.github/workflows/code-review-advisory.yml`](../../.github/workflows/code-review-advisory.yml)
3. Docs: [`docs/code-review-ci.md`](../../docs/code-review-ci.md)

## Configure

| Env / secret | Purpose |
|--------------|---------|
| `GITHUB_TOKEN` | Provided by Actions; needs `pull-requests: write` |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | LLM provider |
| `CODE_REVIEW_MODEL` | Optional model id |
| `CODE_REVIEW_PROJECT_LABEL` | Optional name in the prompt (default: "this repository") |
| `CODE_REVIEW_CONTEXT_FILES` | Optional comma-separated doc paths for context |
| `CODE_REVIEW_EXCLUDE_TOPICS` | Optional “do not review …” line (e.g. delegate to another bot) |

In **this** repo, `CODE_REVIEW_EXCLUDE_TOPICS` is set in the workflow so Astryx design-system feedback stays in the separate Astryx advisory job.

## Local

```bash
BASE=origin/dev HEAD=HEAD node scripts/code-review/advisory.mjs --dry-run
```

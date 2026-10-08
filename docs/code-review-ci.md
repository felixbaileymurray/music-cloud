# Pull request review

General bug review is **[Cursor Bugbot](https://cursor.com/docs/bugbot)**, not a GitHub Action. The previous Claude Code review workflow (`claude-code-action` + `/code-review`) was removed because a single multi-agent run often costs about $15–25 in Anthropic credits.

Bugbot posts inline comments on the pull request. On individual plans it draws from included Cursor usage first; extra runs bill on-demand. Cursor’s published average is about **$1.00–$1.50 per run** (varies with diff size).

[`.cursor/config/bugbot.yaml`](../.cursor/config/bugbot.yaml) sets **once per PR**, skips drafts, and leaves Autofix off. Bugbot reads that file from the PR **base** branch (`dev`), so it applies only after this change is on `dev`. A personal dashboard override still wins over the file.

## Setup (one time, in Cursor)

1. Connect GitHub in the Cursor dashboard.
2. Open Bugbot in Automations and enable it on this repository.

Manual re-run from a PR comment: `bugbot run` (or `cursor review`), if your Bugbot access allows it. On an individual plan, automatic reviews run only on pull requests you author.

Local check before opening a PR: ask the Cursor agent for a Bugbot review of the branch. That uses the same product and the same usage pool.

Design-system feedback is separate and still runs in GitHub Actions as [Astryx Reviewer](astryx-ci.md#astryx-reviewer). That job is one model call (Anthropic or OpenAI), not the multi-agent Claude review.

## Relation to Astryx Reviewer

| Job | Where it runs | Focus |
|-----|----------------|--------|
| **Bugbot** | Cursor, on the GitHub PR | Bugs and regressions, inline comments |
| **Astryx Reviewer** | `scripts/astryx-advisory/` | Astryx CLI docs, component choice (summary comment) |

Both are advisory unless you add branch rules yourself.

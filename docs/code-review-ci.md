# Claude Code review (GitHub)

General pull request review uses Anthropic’s **[Claude Code GitHub Action](https://github.com/anthropics/claude-code-action)** with the official **[code-review plugin](https://github.com/anthropics/claude-code/tree/main/plugins/code-review)** (`/code-review:code-review --comment`). That is the same stack as Claude Code’s native `/code-review` skill: multi-agent review, high-signal filtering, **inline comments** on the PR, plus a summary when needed.

Workflow: [`.github/workflows/claude-code-review.yml`](../.github/workflows/claude-code-review.yml)

Design-system (Astryx) feedback is separate: [`docs/astryx-ci.md`](astryx-ci.md#astryx-advisory-review).

## When it runs

| Event | Behavior |
|-------|----------|
| **Draft PR** | Skipped (`draft == false` in the workflow; the plugin also skips drafts) |
| **Ready for review** | Runs when the PR leaves draft |
| **Open PR (not draft)** | Runs on `opened` |
| **Later pushes** | **Not** triggered (no `synchronize`) — saves cost; the plugin also skips PRs it already reviewed |

To run again after large changes: re-run the **Claude code review** workflow from the Actions tab (the plugin may still skip if it detects an existing Claude review comment — see Anthropic docs).

## Setup (one time)

1. **API key:** Repository secret **`ANTHROPIC_API_KEY`** (Anthropic Console).
2. **Permissions:** The workflow sets `id-token: write` for the action’s auth exchange. Inline comments need `pull-requests: write`.
3. **Optional:** In Claude Code locally, `/install-github-app` for the Claude GitHub App (needed for `@claude` workflows; the code-review plugin workflow above uses the API key path from [Anthropic’s docs](https://code.claude.com/docs/en/github-actions)).

On **public** repos, secrets are not passed to workflows from **fork** PRs; review runs only for branches in the same repository.

## Project guidelines (CLAUDE.md)

The plugin’s compliance agents read **CLAUDE.md** files on touched paths. This repo’s root [`CLAUDE.md`](../CLAUDE.md) points at [`AGENTS.md`](../AGENTS.md) and contributing docs.

## Relation to Astryx advisory

| Job | Tooling | Focus |
|-----|---------|--------|
| **Claude code review** | `claude-code-action` + plugin | Bugs, CLAUDE.md/AGENTS.md compliance, inline threads |
| **Astryx advisory** | `scripts/astryx-advisory/` | Astryx CLI docs, component choice (summary comment) |

Both are advisory (non-blocking) unless you add branch rules yourself.

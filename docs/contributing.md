# Contributing

## Branches and PRs

- Day-to-day work targets **`dev`**.
- Open feature PRs against **`dev`**, not `main`.
- Release PRs use a short-lived `release/X.Y.Z` head into `main`. See [ops.md](ops.md) and [`.cursor/rules/releases.mdc`](../.cursor/rules/releases.mdc).

Full agent policy: [`.cursor/rules/pull-requests.mdc`](../.cursor/rules/pull-requests.mdc).

### PR body shape

1. **Author paragraph** — short note in the author’s own words (what the PR does and contains). Required before an agent drafts the rest.
2. **`## Summary`** — concrete change bullets.
3. **`## Test plan`** — checkbox list of manual checks.

GitHub loads [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) with that structure.

Title style: imperative, specific (see recent merges into `dev`).

## Local checks

- Follow [setup.md](setup.md).
- Run `npm run astryx:check`, `npm run lint`, and `npm run build` when the change warrants it.
- After theme source edits, run `npm run theme:check` (or `theme:build`).

Pull requests to `dev` run [Astryx CI and advisory reviews](astryx-ci.md) on GitHub (general code review + Astryx design-system review). Configure `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` on the repo for advisory PR comments.

## UI

This app uses Astryx. Before new UI, follow [AGENTS.md](../AGENTS.md): discover with `npx astryx`, prefer components over raw layout, use token-backed utilities.

## Brand and app id

- User-facing product strings → `src/lib/brand.ts`
- IndexedDB / share protocol → `src/lib/app-id.ts` (`APP_ID` = `collage`)

Do not hardcode `bricola` or `collage` in components. Policy: [`.cursor/rules/brand.mdc`](../.cursor/rules/brand.mdc).

## Docs

Keep docs short and factual (STE-100 style). Update [architecture.md](architecture.md) when data flow or APIs change. Put unshipped ideas only in [roadmap.md](roadmap.md).

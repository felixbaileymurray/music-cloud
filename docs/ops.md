# Ops and deploy

## Environments

| Branch | Role |
|--------|------|
| `dev` | Integration; day-to-day PRs |
| `main` | Production track; tagged releases |

Production site: `https://bricola.art` (product domain from `src/lib/brand.ts`).

Deploy is expected to follow `main` (Vercel or equivalent). Local `.vercel` metadata is gitignored and excluded from AI indexing.

## Production env

Set the same server variables as local (see [setup.md](setup.md) and [`.env.example`](../.env.example)):

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` — e.g. `https://bricola.art/api/spotify/callback`
- `SPOTIFY_COOKIE_SECRET` — different from local; strong random value

Do not use `NEXT_PUBLIC_` for these. Allowlist the production redirect URI in the Spotify Developer Dashboard.

## Releases

Versioning and the cut checklist live in [`.cursor/rules/releases.mdc`](../.cursor/rules/releases.mdc). Do not copy that recipe here.

Summary:

1. Bump version and [CHANGELOG.md](../CHANGELOG.md) on `dev` (or on the release branch).
2. Open `release/X.Y.Z` → `main` (not `dev` as the PR head).
3. Merge with a **merge commit** (not squash).
4. Tag `vX.Y.Z` on the merge commit on `main`; create the GitHub Release from CHANGELOG notes.
5. Sync `main` back into `dev` if versions diverge.

After `1.0.0`, bump **MINOR** for new capability, **PATCH** for fixes, and **MAJOR** only for breaking user/data changes.

## Secrets

Never commit `.env.local` or real Spotify credentials. Rotate `SPOTIFY_COOKIE_SECRET` if it leaks; existing sessions become invalid.

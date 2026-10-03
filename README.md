# Bricola

Bricola builds a cover cloud from Spotify or a listening-history export. Hover a cover to hear a short snippet.

This is not a library player. Items without a matched, playable preview never enter the cloud.

## Docs

| Doc | Use it for |
|-----|------------|
| [docs/README.md](docs/README.md) | Doc index |
| [docs/product.md](docs/product.md) | Product intent and journeys |
| [docs/setup.md](docs/setup.md) | Local install and env |
| [docs/architecture.md](docs/architecture.md) | Stack, data flow, APIs |
| [docs/contributing.md](docs/contributing.md) | Branches, PRs, conventions |
| [docs/ops.md](docs/ops.md) | Deploy and releases |
| [docs/roadmap.md](docs/roadmap.md) | Unshipped ideas |
| [CHANGELOG.md](CHANGELOG.md) | Released changes |

Agent UI rules live in [AGENTS.md](AGENTS.md). Branch and brand policy live under [`.cursor/rules/`](.cursor/rules/).

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217). Use that host, not `localhost`. See [docs/setup.md](docs/setup.md).

Spotify is optional. Without it, use manual upload or **See an example**.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on `0.0.0.0:43217` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run theme:build` | Build the Bricola Astryx theme CSS |
| `npm run theme:check` | Fail if theme artifacts are stale |

## Use

1. **Create** → Connect Spotify, upload a list, or open an example.
2. Wait for resolve (Deezer, then iTunes). Each preview is probed. Unmatched items are dropped.
3. Set cloud size. Cover size follows listen count or rank weight.
4. Click once to unlock audio, then hover.

Album clouds can rotate up to three snippets per cover. Track clouds play one snippet per cover.

## Repository

The GitHub repository is named `music-cloud`. That is the repo name only. The product name is Bricola.

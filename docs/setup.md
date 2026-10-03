# Local setup

## Prerequisites

- Node.js (use a current LTS that can run Next.js 16)
- npm (lockfile is `package-lock.json`)

## Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217).

Use **`127.0.0.1`**, not `localhost`. Spotify OAuth cookies are host-only. The redirect URI must match that host. `next.config.ts` sets `allowedDevOrigins` for `127.0.0.1` for the same reason.

## Environment

Copy [`.env.example`](../.env.example) to `.env.local`. Never commit real secrets. `.cursorignore` keeps `.env*` out of AI indexing (the example file stays visible).

| Variable | Required | Role |
|----------|----------|------|
| `SPOTIFY_CLIENT_ID` | For Spotify | Spotify app client id |
| `SPOTIFY_CLIENT_SECRET` | For Spotify | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | For Spotify | Exact callback URL |
| `SPOTIFY_COOKIE_SECRET` | For Spotify | Seals the session cookie (`openssl rand -base64 32`) |

All of these are **server-only**. Do not prefix them with `NEXT_PUBLIC_`.

Without Spotify vars, the app still runs. Use manual upload or **See an example**.

### Local Spotify redirect

In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), allow:

`http://127.0.0.1:43217/api/spotify/callback`

Set `SPOTIFY_REDIRECT_URI` to that exact string.

Production example: `https://bricola.art/api/spotify/callback` (also allowlisted in the Spotify app). See [ops.md](ops.md).

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Next dev on hostname `0.0.0.0`, port `43217` |
| `npm run build` | Production build |
| `npm start` | Serve production build on the same host/port |
| `npm run lint` | ESLint |
| `npm run theme:build` | Build `src/theme/bricola.css` from `bricolaTheme.ts` |
| `npm run theme:check` | Check theme artifacts are up to date |

After theme source edits, run `theme:build` (or confirm with `theme:check`).

## Astryx CSS

App entry imports Astryx reset and core CSS. UI work should follow [AGENTS.md](../AGENTS.md) (`npx astryx …`).

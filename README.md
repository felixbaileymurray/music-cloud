# Music Cloud

Cover art cloud from Spotify or a listening history export. Hover a cover to hear a 30-second snippet.

Not a library player. Items without a matched, playable preview are dropped before anything renders.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217) — use this host (not `localhost`). Spotify OAuth cookies are host-only and must match the redirect URI.

## Spotify (optional)

Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and add this redirect URI (must match exactly):

`http://127.0.0.1:43217/api/spotify/callback`

Copy `.env.example` to `.env.local` and set:

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` from the dashboard
- `SPOTIFY_REDIRECT_URI` as above
- `SPOTIFY_COOKIE_SECRET` — random secret, e.g. `openssl rand -base64 32` (use a **different** value in production)

**Never commit secrets.** For Vercel, set the same variables under Project → Environment Variables. Do not use `NEXT_PUBLIC_` for any of these.

Production redirect URI example: `https://your-domain.com/api/spotify/callback` (also allowlisted in the Spotify app).

## Use

1. **Create** → Connect Spotify (top / recently played / saved tracks) or upload manually (album or track clouds).
2. Wait for the preprocess pass (Deezer, then iTunes). Each preview is probed; unmatched items never appear.
3. Set cloud size. Cover size follows listen count or rank/recency weight.
4. Click once to enable sound, then hover.

**Album clouds** (manual): up to three rotating snippets per album. **Track clouds** (Spotify or manual): one snippet per track.

Snippets fade in and out. Deezer clips re-resolve on play so short-lived CDN tokens do not leave silent covers.

## Tests

Playwright E2E regression: `npm run test:e2e` (see [docs/testing.md](docs/testing.md) for layout, coverage, and planned unit tests).

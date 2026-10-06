# Architecture

Single Next.js App Router app. Not a monorepo. Package name on npm/GitHub is `music-cloud`; the product is Bricola.

## Stack

| Piece | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| UI | Astryx 0.6.2 + Tailwind 4 |
| Cloud layout | `d3-force` in `cover-cloud.tsx` |
| Image export | `html-to-image` |
| Auth | Spotify OAuth PKCE; sealed httpOnly cookies |

## Source layout

```text
src/app/           Routes, layout, API handlers
src/components/    CloudApp shell, canvas, create/share/save UI
src/lib/           Resolve, parse, share, Spotify, caches, types
src/theme/         Bricola Astryx theme source + built CSS
```

Entry: `src/app/page.tsx` renders `CloudApp` (`src/components/cloud-app.tsx`).

## Create → resolve → cloud

1. **Intake** — Create flow (`create-cloud-flow.tsx`) yields album listens, track listens, or Spotify track rows. Manual files go through `parse-history.ts` (CSV, Spotify JSON, share JSON, simple `Title - Artist` lines).
2. **Resolve** — Client posts each row to preview APIs. Server tries Deezer, then iTunes. Results that fail the audio probe return as misses.
3. **Hits** — Matched rows become `PreviewHit` (album) or `TrackHit` (track) with `ClipRef`s and cover URL.
4. **Cloud** — Hits feed the force layout. Status counts track processed / found / not found / showing.
5. **Play** — Hover (or lock) drives `snippet-player.ts`. Deezer clips refresh via `/api/clip?deezer=` because CDN URLs expire.

Invariant: **no playable preview → no cover in the cloud.**

### Resolve modules

| Path | Role |
|------|------|
| `src/lib/resolve-preview.ts` | Album: Deezer → iTunes + memory/IDB cache |
| `src/lib/resolve-track-preview.ts` | Track: Deezer → iTunes + memory cache |
| `src/lib/deezer.ts` / `itunes.ts` | Provider lookups and probes |
| `src/lib/preview-probe.ts` | Check that a preview URL actually plays |

### Clip identity

```ts
type ClipRef =
  | { kind: "deezer"; trackId: number }  // stable id; URL refreshed on play
  | { kind: "itunes"; url: string };
```

## API map

| Route | Method | Role |
|-------|--------|------|
| `/api/spotify/login` | GET | Start PKCE OAuth |
| `/api/spotify/callback` | GET | Finish OAuth; set sealed session cookie |
| `/api/spotify/logout` | POST | Clear session cookie |
| `/api/spotify/status` | GET | Connected / configured / display name |
| `/api/spotify/tracks` | POST | Fetch top / recent / saved tracks |
| `/api/preview` | POST | Resolve album preview match |
| `/api/preview-track` | POST | Resolve track preview match |
| `/api/album` | POST | Album metadata for the sidebar |
| `/api/track` | POST | Track metadata for the sidebar |
| `/api/clip` | GET | Proxy preview bytes; refresh Deezer by track id |

Spotify scopes: `user-top-read`, `user-read-recently-played`, `user-library-read`, `user-read-private`.

## Auth and cookies

Config: `SPOTIFY_*` env vars via `src/lib/spotify/config.ts`. Missing config disables Connect Spotify.

Session tokens are sealed with `SPOTIFY_COOKIE_SECRET` (`src/lib/spotify/session.ts`). Cookie names still use an `mc_` prefix from earlier naming:

- `mc_spotify_session`
- `mc_spotify_oauth_state`
- `mc_spotify_code_verifier`

Treat those strings as stable protocol identifiers, not as the product name.

## Client storage

There is **no** server database of listening data.

| Store | Purpose |
|-------|---------|
| IndexedDB `collage-preview-cache` | Album preview resolve cache |
| IndexedDB `collage-track-preview-cache` | Track preview resolve cache |
| URL hash `#cl1=…` | Compressed share document |
| Downloaded JSON | Share / save snapshot (`ShareDocumentV1`) |

`APP_ID` is `collage`. Derive DB names from helpers in `src/lib/app-id.ts`. Do not hardcode the string in call sites. Product rename does **not** change `app-id.ts`. See [`.cursor/rules/brand.mdc`](../.cursor/rules/brand.mdc).

## Share and save

**Share** (`share-payload.ts`, `share-modal.tsx`):

- Build a flat `ShareDocumentV1` from **visible** cloud items only.
- Link: deflate + base64url after prefix `cl1=` (`SHARE_HASH_PREFIX`).
- Link allowed when visible count ≤ 50 and encoded length ≤ 8000 characters after the prefix.
- Otherwise download JSON. Import again through Create → manual upload. Recipient re-resolves audio.

Mental model: share = export flat list and send. Open share = create from imported list.

**Save** (`save-modal.tsx`, `save-image.ts`):

- Image: PNG / JPEG / WebP at 1× / 2× / 3×; canvas frame only; neutral (no hover dim / lock chrome).
- JSON: same visible-item document shape as share.

## UI shell (mental map)

- **Canvas** — covers, physics, zoom, audio unlock overlay.
- **Sidebar** — Create / Share / Save, status dots, customise (cloud size, size ratio, zoom), development physics controls, detail panel on hover/lock.
- **Modals** — create flow, share, save, overwrite warnings.

Large orchestration lives in `cloud-app.tsx`. Prefer that file for wiring; prefer `src/lib/*` for domain logic.

## What not to reinvent here

- Astryx component rules → [AGENTS.md](../AGENTS.md)
- Semver / release recipe → [`.cursor/rules/releases.mdc`](../.cursor/rules/releases.mdc)
- PR author paragraph rule → [`.cursor/rules/pull-requests.mdc`](../.cursor/rules/pull-requests.mdc)

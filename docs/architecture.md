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
src/app/              Routes (`/music`, `/images`), layout, API handlers
src/components/collage/  Vanilla collage shell + shared knobs
src/components/music/    Music feature (`music-collage.tsx`)
src/components/images/   Images feature (`images-collage.tsx`)
src/lib/                Resolve, parse, share, Spotify, caches, types
src/theme/              Bricola Astryx theme source + built CSS
```

Entry: `/` redirects to `/music` (query preserved). `/music` renders `MusicCollage`; `/images` renders `ImagesCollage`.

## Collage spine

Shared, product-neutral collage UI:

- **`src/lib/collage-item.ts`** — `CollageItem` (`id`, `imageUrl`, `label`, `weight`, optional `aspectRatio`).
- **`src/components/collage/collage-shell.tsx`** — Layout, customise knobs, canvas slot, save wiring hooks.
- **`src/components/cover-cloud.tsx`** — Force layout and hover/lock visuals on `CollageItem`s. Nodes keep area ≈ square sizing; collide radius stays `r + pad` (unchanged from square covers).

Features compose the shell with slots (empty state, create modal, right panel, canvas background, actions). Prefer a slot or callback over feature-specific fields on `CollageItem`. Intrinsic media data (e.g. `aspectRatio`) may live on the item.

### Create journeys (not in the spine)

Create flows stay **per feature**, not on the shared spine. Music and images share the chooser → manual / example shape today, but intakes and side effects already differ (Spotify + resolve vs local files + static assets) and will diverge further. Prefer a dedicated flow component per section (`create-cloud-flow.tsx`, `create-images-flow.tsx`) over a polymorphic spine create step.

## Music feature (`/music`)

Orchestration: `src/components/music/music-collage.tsx`.

### Create → resolve → cloud

1. **Intake** — Create flow (`create-cloud-flow.tsx`) yields album listens, track listens, or Spotify track rows. Manual files go through `parse-history.ts` (CSV, Spotify JSON, share JSON, simple `Title - Artist` lines).
2. **Resolve** — Client posts each row to preview APIs. Server tries Deezer, then iTunes. Results that fail the audio probe return as misses.
3. **Hits** — Matched rows become `PreviewHit` (album) or `TrackHit` (track) with `ClipRef`s and cover URL.
4. **Cloud** — Hits map to `CollageItem`s (`src/lib/music-collage-items.ts`) and feed the force layout.
5. **Play** — Hover (or lock) drives `snippet-player.ts` via `use-music-cloud-audio.ts`. Deezer clips refresh via `/api/clip?deezer=` because CDN URLs expire.

Invariant (music only): **no playable preview → no cover in the cloud.**

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

## Images feature (`/images`)

Orchestration: `src/components/images/images-collage.tsx`.

### Create → cloud

1. **Chooser** — `CreateImagesFlow` (`create-images-flow.tsx`): **Create Manually** or **See an example** (same gate / replace-warning pattern as music).
2. **Manual** — Local `image/*` files via `ImageIntake`; object URLs in the browser (no upload server).
3. **Example** — Sample from `src/lib/example-images.ts` (bundled Unsplash architecture JPEGs under `public/examples/architecture/`). No resolve step.
4. **Cloud** — Each image becomes a `CollageItem` with weight `1` and natural `aspectRatio` (even sizes until size ratio is raised).
5. **Canvas look** — Flat background colour (Riso-style swatches) always; optional `@paper-design/shaders-react` `PaperTexture` on top. Right panel: Canvas (colour, texture toggle, seed/roughness/wrinkles/drops) and Items (spacing, frame width; frame colour matches canvas). Shadows are baked in presets (`paper-presets.ts`).
6. **Save** — Primary action; JSON backup and URL share are not offered in this slice. Export snapshots the WebGL paper layer before `html-to-image` capture (`paper-capture.ts`).

Hover and lock remain on the canvas; the right panel is global paper + item chrome styling, not per-image metadata.

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
| URL hash `#cl1=…` | Compressed share document (music) |
| Downloaded JSON | Share / save snapshot (`ShareDocumentV1`, music) |

`APP_ID` is `collage`. Derive DB names from helpers in `src/lib/app-id.ts`. Do not hardcode the string in call sites. Product rename does **not** change `app-id.ts`. See [`.cursor/rules/brand.mdc`](../.cursor/rules/brand.mdc).

## Share and save

**Share** (music — `share-payload.ts`, `share-modal.tsx`):

- Build a flat `ShareDocumentV1` from **visible** cloud items only.
- Link: deflate + base64url after prefix `cl1=` (`SHARE_HASH_PREFIX`).
- Link allowed when visible count ≤ 50 and encoded length ≤ 8000 characters after the prefix.
- Otherwise download JSON. Import again through Create → manual upload. Recipient re-resolves audio.

**Save** (`save-modal.tsx`, `save-image.ts`):

- Image: PNG / JPEG / WebP at 1× / 2× / 3×; canvas frame only; neutral (no hover dim / lock chrome).
- JSON backup: same visible-item document shape as share (music only).

## What not to reinvent here

- Astryx component rules → [AGENTS.md](../AGENTS.md)
- Semver / release recipe → [`.cursor/rules/releases.mdc`](../.cursor/rules/releases.mdc)
- PR author paragraph rule → [`.cursor/rules/pull-requests.mdc`](../.cursor/rules/pull-requests.mdc)

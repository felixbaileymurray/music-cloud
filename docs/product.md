# Product

## What Bricola is

Bricola is a cover cloud. It turns a listening list into an interactive field of covers. Hover a cover to hear a short snippet.

It is not a full library or a full-track player. Only items with a matched, playable preview appear.

## Name

- **Product name:** Bricola
- **Repository name:** `music-cloud` (Git remote / `package.json` `"name"` only)
- **Technical app id:** `collage` (`APP_ID` in `src/lib/app-id.ts`) — IndexedDB and share protocol
- Do not treat “music cloud” as the product name. That wording is deprecated pre-v1.0 naming.

## Main journeys

### Music (`/music`)

1. **Create**
   - Connect Spotify (top tracks, recently played, or saved tracks), or
   - Upload a manual list (album or track), or
   - **See an example** (preset albums).
2. **Resolve** — match each row to cover art and preview audio (Deezer first, then iTunes). Probe audio. Drop failures.
3. **Explore** — set how many covers show. Hover to play. Click to lock a cover and keep the sidebar open.
4. **Share** — copy a link (visible items ≤ 50) or download JSON (any size).
5. **Save** — export a canvas image (PNG / JPEG / WebP) and/or a JSON snapshot.

### Images (`/images`)

1. **Create** — **Create Manually** (local photos) or **See an example** (bundled architecture photos). Separate flow from music; no Spotify / resolve.
2. **Explore** — arrange on a paper canvas; customise colour, texture, spacing, and frame.
3. **Save** — export a still image. Link share is not offered yet.

## Cloud kinds

| Kind | Status | Snippets |
|------|--------|----------|
| Album | Shipped | Up to three rotating clips per cover |
| Track | Shipped | One clip per cover |
| Artist | Not shipped | Create UI shows the option disabled |

Spotify create currently builds **track** clouds. Manual create supports album or track.

## Constraints (current thinking)

- No playable preview → item never renders.
- Listening lists are not stored on the server. Share and save are client-side exports.
- Opening a share or JSON file **re-resolves** previews on the recipient machine.
- Share **links** use the visible slice only, capped at 50 items (plus an encoded-size limit). Larger clouds use JSON download.
- Default cloud size caps at 50 after resolve; the slider can raise the count up to the matched total.
- Audio needs one user gesture to unlock (browser autoplay rules).

## Brand vs storage

User-facing name, domain, and download stems come from `src/lib/brand.ts`. Storage DB names and the share hash prefix come from `src/lib/app-id.ts`. See [`.cursor/rules/brand.mdc`](../.cursor/rules/brand.mdc).

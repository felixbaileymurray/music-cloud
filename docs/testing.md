# Testing

Reference for automated regression and planned follow-ups.

## Layout

```text
playwright.config.ts          # runner config (repo root — Playwright default)
tests/
  e2e/                        # browser end-to-end specs
    create/
    save/
    share/
    helpers/                  # mocks, seedCloud, share hash helper
    fixtures/
```

Unit tests are **not** set up yet; reserve `tests/unit/` when adding them.

## Running E2E

```bash
npm run test:e2e:install   # Chromium, first time
npm run test:e2e           # headless
npm run test:e2e:ui        # Playwright UI mode
```

Dev server: `http://127.0.0.1:43217` (started automatically unless one is already running).

## What E2E covers today

| Spec | Flow |
|------|------|
| `create/example.spec.ts` | Create → See an example → covers appear |
| `create/replace-gate.spec.ts` | Existing cloud → Create → replace warning → Create anyway |
| `save/save.spec.ts` | Seed cloud → Save → Download JSON (`ShareDocumentV1`) |
| `share/share.spec.ts` | Copy share link (+ clipboard); open `#mc1=` from fixture |

**Seeding:** `seedCloudViaExample()` in `tests/e2e/helpers/cloud.ts` — mocked previews + example path. Save, share, and replace specs reuse this instead of walking Manual/Spotify create.

**Mocks** (`tests/e2e/helpers/mock-apis.ts`): `POST /api/preview`, `POST /api/preview-track`, `GET /api/spotify/status`. No live Deezer/iTunes or OAuth.

**Selectors:** Cloud sidebar (`getByLabel("Cloud sidebar")`) for Create/Save/Share; canvas covers via `getByLabel("Cloud canvas")` + `getByRole("button", { name: / by / })`. Example cloud **randomly samples** albums — assert any cover, not a fixed title (share-hash test uses a one-album fixture).

**Create paths not duplicated in E2E:** Manual paste/file and Spotify wizard share the same post-resolve UI as example; example is the single happy-path for “cloud rendered.”

## Intentionally manual (first pass)

- Save **image** (`html-to-image` capture)
- Real **Spotify OAuth**
- **Audio** playback, hover/lock snippets
- **d3-force** layout positions
- Customise sliders, info panel, empty-match / error recovery
- Share link disabled when **>50 items**

## Planned unit tests (`tests/unit/`)

Prefer unit tests for logic that E2E would only retest indirectly:

| Area | Module | Cases |
|------|--------|--------|
| History parsing | `src/lib/parse-history.ts` | Spotify JSON, CSV columns, `Title - Artist` / `Album - Artist` lines, merge, kind mismatch, empty/unreadable |
| Share document | `src/lib/share-payload.ts` | `isShareDocument`, `parseShareJson`, `encodeShareHash` / `decodeShareHash`, `canBuildShareUrl` / length limits, `recipientSourceLabel` |
| Normalize (if used by parser) | `src/lib/normalize.ts` | Edge cases as needed |

Runner: not chosen yet (Vitest is a common fit for Next/TS). Keep tests colocated under `tests/unit/` mirroring `src/lib/` where helpful.

## Planned E2E follow-ups

- **Thin Spotify wizard:** mock `status` + `tracks`, assert `POST /api/spotify/tracks` and modal closes — not full cloud render.
- **Manual create (optional):** only if paste UI regresses often; parser itself belongs in unit tests.
- **Save image download** if stable in CI.
- **GitHub Actions** on PRs to `dev` (`test:e2e:install` + `test:e2e`).

## Why config stays at repo root

`playwright.config.ts` and default report dirs (`test-results/`, `playwright-report/`) live next to `package.json` so `playwright test` and npm scripts work without extra flags. Specs and fixtures live under `tests/`.

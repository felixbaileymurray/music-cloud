# Future features

Notes for later branches. Prefer shipping UI and real behavior together rather than empty modal shells.

## Save / export modal

**Image export is on `feat/save`.** Sidebar **Save** opens a modal with PNG/JPEG, resolution presets (Low/Medium/High → 1×/2×/3×), JPEG quality presets, and a download of the cloud canvas only (neutral visuals, canvas aspect ratio, solid canvas background). Filenames include kind and date.

Still to add after **Share** merges:

- Download a **backup JSON** in the same shape as Share’s flat-list snapshot, so users can re-create the cloud later without Spotify

## Share

**Shipped on `feat/share`.** Sidebar **Share** opens a modal with Copy share URL (up to 50 items), Download JSON (any size), and Open share file. Links embed a compressed flat list in the URL hash; larger clouds use the JSON file only.

Mental model:

- Sharing is **export-as-flat-list-and-send**
- Opening a share is **create-from-imported-file** (re-match on the recipient)
- No server-side storage of listening data

Future: chat integrations, optional short-link hosting for very large lists.

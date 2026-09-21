# Future features

Notes for later branches. Prefer shipping UI and real behavior together rather than empty modal shells.

## Save / export modal

**Shipped on `feat/save`.** Sidebar **Save** opens a modal with:

- Image export: PNG/JPEG/WebP, resolution Low/Medium/High (1×/2×/3×), cloud-canvas-only capture (neutral visuals, current aspect ratio, solid canvas background)
- JSON snapshot: same flat-list document as Share (`ShareDocumentV1` of visible items), re-open via Create upload

Filenames include kind and date.

## Share

**Shipped on `feat/share`.** Sidebar **Share** opens a modal with Copy share URL (up to 50 items) and Download JSON (any size). Links embed a compressed flat list in the URL hash; larger clouds use the JSON file only. Share JSON can also be re-opened through Create upload.

Mental model:

- Sharing is **export-as-flat-list-and-send**
- Opening a share is **create-from-imported-file** (re-match on the recipient)
- No server-side storage of listening data

Future: chat integrations, optional short-link hosting for very large lists.

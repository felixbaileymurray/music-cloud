# Future features

Notes for later branches. Prefer shipping UI and real behavior together rather than empty modal shells.

## Save / export modal

Sidebar **Save** (ghost icon when a cloud exists) should open its own export modal with:

- Image type: `.png` / `.jpeg`
- Resolution presets
- Option to download a **backup flat-list file** in the same shape as a manual import, so users can re-create the cloud later without re-matching

Implement the modal UI and working export in one branch.

## Share

**Shipped on `feat/share`.** Sidebar **Share** opens a modal with Copy share URL (up to 50 items), Download JSON (any size), and Open share file. Links embed a compressed flat list in the URL hash; larger clouds use the JSON file only.

Mental model:

- Sharing is **export-as-flat-list-and-send**
- Opening a share is **create-from-imported-file** (re-match on the recipient)
- No server-side storage of listening data

Future: chat integrations, optional short-link hosting for very large lists.

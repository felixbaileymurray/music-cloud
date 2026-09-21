# Future features

Notes for later branches. Prefer shipping UI and real behavior together rather than empty modal shells.

## Save / export modal

**Image export is on `feat/save`.** Sidebar **Save** opens a modal with PNG/JPEG, resolution presets (Low/Medium/High → 1×/2×/3×), JPEG quality presets, and a download of the cloud canvas only (neutral visuals, canvas aspect ratio, solid canvas background). Filenames include kind and date.

Still to add after **Share** merges:

- Download a **backup JSON** in the same shape as Share’s flat-list snapshot, so users can re-create the cloud later without Spotify

## Share

Sidebar **Share** (primary icon when a cloud exists) should open a share modal with options such as link, chat integrations, and similar.

Mental model:

- Sharing is essentially **export-as-flat-list-and-send** in one action
- Opening a shared cloud is **create-from-imported-file** without the user doing separate export/import steps
- A share link may be able to carry the cloud data inline (details TBD)

Build share UI and transport together in a dedicated branch.

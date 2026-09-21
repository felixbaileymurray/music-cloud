# Future features

Notes for later branches. Prefer shipping UI and real behavior together rather than empty modal shells.

## Save / export modal

Sidebar **Save** (ghost icon when a cloud exists) should open its own export modal with:

- Image type: `.png` / `.jpeg`
- Resolution presets
- Option to download a **backup flat-list file** in the same shape as a manual import, so users can re-create the cloud later without re-matching

Implement the modal UI and working export in one branch.

## Share

Sidebar **Share** (primary icon when a cloud exists) should open a share modal with options such as link, chat integrations, and similar.

Mental model:

- Sharing is essentially **export-as-flat-list-and-send** in one action
- Opening a shared cloud is **create-from-imported-file** without the user doing separate export/import steps
- A share link may be able to carry the cloud data inline (details TBD)

Build share UI and transport together in a dedicated branch.

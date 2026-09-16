# Music Cloud

Album-first listening library. Browse a seeded shelf, open an album, play it through a persistent bar, or import audio from this computer (stored only in the browser).

## Run locally

The app lives on `cursor/music-cloud-first-slice-3890` (and `main` once pulled). If `package.json` is missing, you are on the empty seed commit:

```bash
git fetch origin
git checkout cursor/music-cloud-first-slice-3890
# or: git checkout main && git pull
npm install
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217).

## What you can do

- Browse six seeded albums and search by title, artist, genre, or track
- Open an album page and play the whole record or a single track
- Keep listening while you move between the library and album pages
- Import MP3/WAV/FLAC/AAC files into a local **Imported** album (IndexedDB, nothing uploaded)

Seeded audio is short generated loops so playback works offline without copyrighted recordings.

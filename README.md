# Music Cloud

Cover art cloud from a listening history list. Hover a cover to hear a 30-second snippet.

Not a library player. Albums without a matched preview are dropped before anything renders.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217).

## Use

1. Drop a Spotify extended streaming-history JSON export, a CSV with `album` and `artist` columns, or paste `Album - Artist` lines. An example CSV is included (`public/example-history.csv`).
2. Wait for the preprocess pass (Deezer top tracks by popularity, then iTunes). Unmatched albums never appear.
3. Set cloud size. Cover size follows listen count.
4. Click once to enable sound, then hover.

Snippets fade in and out. A clip does not loop. Hover away and back to hear the next of up to three tracks.

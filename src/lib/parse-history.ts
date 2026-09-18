import type {
  AlbumListen,
  CloudKind,
  ParseIssue,
  ParseResult,
  TrackListen,
  TrackParseResult,
  AnyParseResult,
} from "@/lib/types";

const ALBUM_KEYS = [
  "master_metadata_album_album_name",
  "albumName",
  "album_name",
  "album",
  "Album",
  "albumTitle",
] as const;

const TRACK_KEYS = [
  "master_metadata_track_name",
  "trackName",
  "track_name",
  "track",
  "Track",
  "song",
  "title",
] as const;

const ARTIST_KEYS = [
  "master_metadata_album_artist_name",
  "master_metadata_album_artist_name",
  "albumArtistName",
  "album_artist",
  "albumArtist",
  "artistName",
  "artist_name",
  "artist",
  "Artist",
] as const;

const COUNT_KEYS = ["listenCount", "count", "plays", "playCount"] as const;

export type ParseKind = Extract<CloudKind, "album" | "track">;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function numberField(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function addAlbumListen(
  bucket: Map<string, AlbumListen>,
  album: string,
  artist: string,
  amount: number
) {
  const key = `${album.toLowerCase()}:::${artist.toLowerCase()}`;
  const existing = bucket.get(key);
  if (existing) {
    existing.listenCount += amount;
    return;
  }
  bucket.set(key, { album, artist, listenCount: amount });
}

function addTrackListen(
  bucket: Map<string, TrackListen>,
  track: string,
  artist: string,
  album: string | undefined,
  amount: number
) {
  const key = `${track.toLowerCase()}:::${artist.toLowerCase()}`;
  const existing = bucket.get(key);
  if (existing) {
    existing.listenCount += amount;
    if (!existing.album && album) existing.album = album;
    return;
  }
  bucket.set(key, { track, artist, album, listenCount: amount });
}

function collectAlbumRows(rows: unknown[]) {
  const bucket = new Map<string, AlbumListen>();
  let skippedRows = 0;

  for (const item of rows) {
    const row = asRecord(item);
    if (!row) {
      skippedRows += 1;
      continue;
    }
    const album = stringField(row, ALBUM_KEYS);
    const artist = stringField(row, ARTIST_KEYS);
    if (!album || !artist) {
      skippedRows += 1;
      continue;
    }
    addAlbumListen(bucket, album, artist, numberField(row, COUNT_KEYS) ?? 1);
  }

  return { listens: [...bucket.values()], skippedRows };
}

function collectTrackRows(rows: unknown[]) {
  const bucket = new Map<string, TrackListen>();
  let skippedRows = 0;

  for (const item of rows) {
    const row = asRecord(item);
    if (!row) {
      skippedRows += 1;
      continue;
    }
    const track = stringField(row, TRACK_KEYS);
    const artist = stringField(row, ARTIST_KEYS);
    if (!track || !artist) {
      skippedRows += 1;
      continue;
    }
    const album = stringField(row, ALBUM_KEYS) ?? undefined;
    addTrackListen(
      bucket,
      track,
      artist,
      album,
      numberField(row, COUNT_KEYS) ?? 1
    );
  }

  return { listens: [...bucket.values()], skippedRows };
}

function extractJsonRows(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return null;
  for (const key of ["endSong", "streamingHistory", "history", "items", "albums"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return null;
}

function parseCsv(text: string, kind: ParseKind) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;
  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const albumIdx = header.findIndex((cell) => /album/.test(cell) && !/artist/.test(cell));
  const artistIdx = header.findIndex((cell) => /artist/.test(cell));
  const trackIdx = header.findIndex(
    (cell) => /track|song|title/.test(cell) && !/artist/.test(cell)
  );

  if (kind === "album") {
    if (albumIdx < 0 || artistIdx < 0) return null;
  } else if (trackIdx < 0 || artistIdx < 0) {
    return null;
  }

  const countIdx = header.findIndex((cell) =>
    ["count", "plays", "listens", "listencount", "playcount"].includes(
      cell.replace(/[\s_]/g, "")
    )
  );

  const rows: Record<string, unknown>[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    if (kind === "album") {
      rows.push({
        album: cells[albumIdx] ?? "",
        artist: cells[artistIdx] ?? "",
        count: countIdx >= 0 ? cells[countIdx] ?? "" : "",
      });
    } else {
      rows.push({
        track: cells[trackIdx] ?? "",
        artist: cells[artistIdx] ?? "",
        album: albumIdx >= 0 ? cells[albumIdx] ?? "" : "",
        count: countIdx >= 0 ? cells[countIdx] ?? "" : "",
      });
    }
  }
  return rows;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseTextList(text: string, kind: ParseKind) {
  const rows: Record<string, unknown>[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s[-–—]\s/);
    if (parts.length < 2) continue;
    if (kind === "album") {
      rows.push({
        album: parts[0].trim(),
        artist: parts.slice(1).join(" - ").trim(),
      });
    } else {
      rows.push({
        track: parts[0].trim(),
        artist: parts.slice(1).join(" - ").trim(),
      });
    }
  }
  return rows;
}

export function parseHistoryText(
  text: string,
  sourceLabel: string,
  kind: ParseKind = "album"
): AnyParseResult {
  const issues: ParseIssue[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    const empty = {
      listens: [] as AlbumListen[] | TrackListen[],
      skippedRows: 0,
      sourceLabel,
      issues: [{ code: "empty" as const, detail: `${sourceLabel} was empty.` }],
    };
    return kind === "track"
      ? { kind: "track", ...(empty as Omit<TrackParseResult, "kind">) }
      : { kind: "album", ...(empty as Omit<ParseResult, "kind">) };
  }

  const jsonTried = trimmed.startsWith("[") || trimmed.startsWith("{");
  if (jsonTried) {
    try {
      const rows = extractJsonRows(JSON.parse(trimmed));
      if (!rows) {
        const fail = {
          listens: [] as AlbumListen[] | TrackListen[],
          skippedRows: 0,
          sourceLabel,
          issues: [
            {
              code: "unknown-format" as const,
              detail: `${sourceLabel} was JSON, but not a list of plays.`,
            },
          ],
        };
        return kind === "track"
          ? { kind: "track", ...(fail as Omit<TrackParseResult, "kind">) }
          : { kind: "album", ...(fail as Omit<ParseResult, "kind">) };
      }
      const collected =
        kind === "track" ? collectTrackRows(rows) : collectAlbumRows(rows);
      if (collected.listens.length === 0) {
        issues.push({
          code: kind === "track" ? "no-track-artist" : "no-album-artist",
          detail:
            kind === "track"
              ? `${sourceLabel} had no track + artist fields.`
              : `${sourceLabel} had no album + artist fields. Classic Spotify StreamingHistory files without album names are skipped until grouping is specified.`,
        });
      }
      const sorted = [...collected.listens].sort(
        (a, b) => b.listenCount - a.listenCount
      );
      const base = {
        listens: sorted,
        skippedRows: collected.skippedRows,
        sourceLabel,
        issues,
      };
      return kind === "track"
        ? { kind: "track", ...(base as Omit<TrackParseResult, "kind">) }
        : { kind: "album", ...(base as Omit<ParseResult, "kind">) };
    } catch {
      const fail = {
        listens: [] as AlbumListen[] | TrackListen[],
        skippedRows: 0,
        sourceLabel,
        issues: [
          { code: "unreadable" as const, detail: `${sourceLabel} was not valid JSON.` },
        ],
      };
      return kind === "track"
        ? { kind: "track", ...(fail as Omit<TrackParseResult, "kind">) }
        : { kind: "album", ...(fail as Omit<ParseResult, "kind">) };
    }
  }

  const csvRows = parseCsv(trimmed, kind);
  if (csvRows) {
    const collected =
      kind === "track" ? collectTrackRows(csvRows) : collectAlbumRows(csvRows);
    if (collected.listens.length === 0) {
      issues.push({
        code: kind === "track" ? "no-track-artist" : "no-album-artist",
        detail:
          kind === "track"
            ? `${sourceLabel} CSV had track/artist headers but no usable rows.`
            : `${sourceLabel} CSV had album/artist headers but no usable rows.`,
      });
    }
    const sorted = [...collected.listens].sort(
      (a, b) => b.listenCount - a.listenCount
    );
    const base = {
      listens: sorted,
      skippedRows: collected.skippedRows,
      sourceLabel,
      issues,
    };
    return kind === "track"
      ? { kind: "track", ...(base as Omit<TrackParseResult, "kind">) }
      : { kind: "album", ...(base as Omit<ParseResult, "kind">) };
  }

  const textRows = parseTextList(trimmed, kind);
  const collected =
    kind === "track" ? collectTrackRows(textRows) : collectAlbumRows(textRows);
  if (collected.listens.length === 0) {
    issues.push({
      code: "unknown-format",
      detail:
        kind === "track"
          ? `${sourceLabel} needs JSON, CSV with track and artist columns, or lines like "Track - Artist".`
          : `${sourceLabel} needs JSON, CSV with album and artist columns, or lines like "Album - Artist".`,
    });
  }
  const sorted = [...collected.listens].sort(
    (a, b) => b.listenCount - a.listenCount
  );
  const base = {
    listens: sorted,
    skippedRows: collected.skippedRows,
    sourceLabel,
    issues,
  };
  return kind === "track"
    ? { kind: "track", ...(base as Omit<TrackParseResult, "kind">) }
    : { kind: "album", ...(base as Omit<ParseResult, "kind">) };
}

export function mergeParses(results: AnyParseResult[]): AnyParseResult {
  const kind = results[0]?.kind ?? "album";
  if (kind === "track") {
    const bucket = new Map<string, TrackListen>();
    let skippedRows = 0;
    const issues: ParseIssue[] = [];
    const labels: string[] = [];

    for (const result of results) {
      if (result.kind !== "track") continue;
      labels.push(result.sourceLabel);
      skippedRows += result.skippedRows;
      issues.push(...result.issues);
      for (const listen of result.listens) {
        addTrackListen(
          bucket,
          listen.track,
          listen.artist,
          listen.album,
          listen.listenCount
        );
      }
    }

    const listens = [...bucket.values()].sort(
      (a, b) => b.listenCount - a.listenCount
    );
    return {
      kind: "track",
      listens,
      skippedRows,
      sourceLabel: labels.join(", "),
      issues,
    };
  }

  const bucket = new Map<string, AlbumListen>();
  let skippedRows = 0;
  const issues: ParseIssue[] = [];
  const labels: string[] = [];

  for (const result of results) {
    if (result.kind !== "album") continue;
    labels.push(result.sourceLabel);
    skippedRows += result.skippedRows;
    issues.push(...result.issues);
    for (const listen of result.listens) {
      addAlbumListen(bucket, listen.album, listen.artist, listen.listenCount);
    }
  }

  const listens = [...bucket.values()].sort(
    (a, b) => b.listenCount - a.listenCount
  );
  return {
    kind: "album",
    listens,
    skippedRows,
    sourceLabel: labels.join(", "),
    issues,
  };
}

import type { AlbumListen, ParseIssue, ParseResult } from "@/lib/types";

const ALBUM_KEYS = [
  "master_metadata_album_album_name",
  "albumName",
  "album_name",
  "album",
  "Album",
  "albumTitle",
] as const;

const ARTIST_KEYS = [
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

function addListen(
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

function collectFromRows(rows: unknown[]) {
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
    addListen(bucket, album, artist, numberField(row, COUNT_KEYS) ?? 1);
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

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;
  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const albumIdx = header.findIndex((cell) => /album/.test(cell) && !/artist/.test(cell));
  const artistIdx = header.findIndex((cell) => /artist/.test(cell));
  if (albumIdx < 0 || artistIdx < 0) return null;

  const countIdx = header.findIndex((cell) =>
    ["count", "plays", "listens", "listencount", "playcount"].includes(cell.replace(/[\s_]/g, ""))
  );

  const rows: Record<string, unknown>[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    rows.push({
      album: cells[albumIdx] ?? "",
      artist: cells[artistIdx] ?? "",
      count: countIdx >= 0 ? cells[countIdx] ?? "" : "",
    });
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

function parseTextList(text: string) {
  const rows: Record<string, unknown>[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s[-–—]\s/);
    if (parts.length < 2) continue;
    rows.push({
      album: parts[0].trim(),
      artist: parts.slice(1).join(" - ").trim(),
    });
  }
  return rows;
}

export function parseHistoryText(text: string, sourceLabel: string): ParseResult {
  const issues: ParseIssue[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      listens: [],
      skippedRows: 0,
      sourceLabel,
      issues: [{ code: "empty", detail: `${sourceLabel} was empty.` }],
    };
  }

  const jsonTried = trimmed.startsWith("[") || trimmed.startsWith("{");
  if (jsonTried) {
    try {
      const rows = extractJsonRows(JSON.parse(trimmed));
      if (!rows) {
        return {
          listens: [],
          skippedRows: 0,
          sourceLabel,
          issues: [
            {
              code: "unknown-format",
              detail: `${sourceLabel} was JSON, but not a list of plays.`,
            },
          ],
        };
      }
      const collected = collectFromRows(rows);
      if (collected.listens.length === 0) {
        issues.push({
          code: "no-album-artist",
          detail:
            `${sourceLabel} had no album + artist fields. Classic Spotify StreamingHistory files without album names are skipped until grouping is specified.`,
        });
      }
      return { ...collected, sourceLabel, issues };
    } catch {
      return {
        listens: [],
        skippedRows: 0,
        sourceLabel,
        issues: [{ code: "unreadable", detail: `${sourceLabel} was not valid JSON.` }],
      };
    }
  }

  const csvRows = parseCsv(trimmed);
  if (csvRows) {
    const collected = collectFromRows(csvRows);
    if (collected.listens.length === 0) {
      issues.push({
        code: "no-album-artist",
        detail: `${sourceLabel} CSV had album/artist headers but no usable rows.`,
      });
    }
    return { ...collected, sourceLabel, issues };
  }

  const textRows = parseTextList(trimmed);
  const collected = collectFromRows(textRows);
  if (collected.listens.length === 0) {
    issues.push({
      code: "unknown-format",
      detail: `${sourceLabel} needs JSON, CSV with album and artist columns, or lines like "Album - Artist".`,
    });
  }
  return { ...collected, sourceLabel, issues };
}

export function mergeParses(results: ParseResult[]): ParseResult {
  const bucket = new Map<string, AlbumListen>();
  let skippedRows = 0;
  const issues: ParseIssue[] = [];
  const labels: string[] = [];

  for (const result of results) {
    labels.push(result.sourceLabel);
    skippedRows += result.skippedRows;
    issues.push(...result.issues);
    for (const listen of result.listens) {
      addListen(bucket, listen.album, listen.artist, listen.listenCount);
    }
  }

  const listens = [...bucket.values()].sort((a, b) => b.listenCount - a.listenCount);
  return {
    listens,
    skippedRows,
    sourceLabel: labels.join(", "),
    issues,
  };
}

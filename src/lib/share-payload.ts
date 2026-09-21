import { isTrackHit } from "@/lib/types";
import type {
  AlbumListen,
  CloudHit,
  CloudKind,
  PreviewHit,
  TrackListen,
} from "@/lib/types";

export const SHARE_URL_MAX_ITEMS = 50;
export const SHARE_HASH_PREFIX = "mc1=";
/** Safe ceiling for encoded hash payload (chars after prefix). */
export const MAX_SHARE_HASH_LENGTH = 8000;
export const SHARE_FILE_NAME = "music-cloud-share.json";

export type ShareDocumentV1 = {
  v: 1;
  kind: "album" | "track";
  sourceLabel: string;
  listens: AlbumListen[] | TrackListen[];
};

export function isShareDocument(value: unknown): value is ShareDocumentV1 {
  if (!value || typeof value !== "object") return false;
  const doc = value as ShareDocumentV1;
  if (doc.v !== 1) return false;
  if (doc.kind !== "album" && doc.kind !== "track") return false;
  if (typeof doc.sourceLabel !== "string") return false;
  if (!Array.isArray(doc.listens) || doc.listens.length === 0) return false;
  for (const row of doc.listens) {
    if (!row || typeof row !== "object") return false;
    if (typeof row.artist !== "string" || typeof row.listenCount !== "number") {
      return false;
    }
    if (doc.kind === "album") {
      if (typeof (row as AlbumListen).album !== "string") return false;
    } else if (typeof (row as TrackListen).track !== "string") return false;
  }
  return true;
}

export function buildShareDocumentFromVisible(
  cloudKind: CloudKind,
  sourceLabel: string,
  visibleHits: CloudHit[]
): ShareDocumentV1 | null {
  if (cloudKind === "artist" || visibleHits.length === 0) return null;

  if (cloudKind === "track") {
    const listens: TrackListen[] = [];
    for (const hit of visibleHits) {
      if (!isTrackHit(hit)) continue;
      listens.push({
        track: hit.track,
        artist: hit.artist,
        album: hit.album,
        listenCount: hit.listenCount,
      });
    }
    if (listens.length === 0) return null;
    return { v: 1, kind: "track", sourceLabel, listens };
  }

  const listens: AlbumListen[] = [];
  for (const hit of visibleHits) {
    if (isTrackHit(hit)) continue;
    const albumHit = hit as PreviewHit;
    listens.push({
      album: albumHit.album,
      artist: albumHit.artist,
      listenCount: albumHit.listenCount,
    });
  }
  if (listens.length === 0) return null;
  return { v: 1, kind: "album", sourceLabel, listens };
}

export function shareItemTypeLabel(
  cloudKind: CloudKind,
  count: number
): string {
  const noun =
    cloudKind === "track"
      ? "track"
      : cloudKind === "artist"
        ? "artist"
        : "album";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function shareDocumentToJson(doc: ShareDocumentV1): string {
  return JSON.stringify(doc, null, 2);
}

export function parseShareJson(text: string): ShareDocumentV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!isShareDocument(parsed)) {
    throw new Error(
      "Unrecognized share file. Use a Music Cloud share JSON export."
    );
  }
  return parsed;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deflateUtf8(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(
    new CompressionStream("deflate")
  );
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function inflateUtf8(bytes: Uint8Array): Promise<string> {
  const copy = Uint8Array.from(bytes);
  const stream = new Blob([copy]).stream().pipeThrough(
    new DecompressionStream("deflate")
  );
  return await new Response(stream).text();
}

export async function encodeShareHash(doc: ShareDocumentV1): Promise<string> {
  const json = JSON.stringify(doc);
  const compressed = await deflateUtf8(json);
  return SHARE_HASH_PREFIX + bytesToBase64Url(compressed);
}

export async function decodeShareHash(hash: string): Promise<ShareDocumentV1> {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed.startsWith(SHARE_HASH_PREFIX)) {
    throw new Error("Missing share payload in link.");
  }
  const encoded = trimmed.slice(SHARE_HASH_PREFIX.length);
  if (!encoded) throw new Error("Share link is empty.");
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(encoded);
  } catch {
    throw new Error("Share link is corrupted.");
  }
  let json: string;
  try {
    json = await inflateUtf8(bytes);
  } catch {
    throw new Error("Could not read share link.");
  }
  return parseShareJson(json);
}

export function shareUrlLargeListDescription(listenCount: number): string {
  return `Share links are unavailable for large lists. This cloud has ${listenCount} items. Download the JSON file and share that instead.`;
}

export async function buildSharePageUrl(
  doc: ShareDocumentV1,
  origin = typeof window !== "undefined" ? window.location.origin : "",
  pathname = typeof window !== "undefined" ? window.location.pathname : "/"
): Promise<string | null> {
  if (doc.listens.length > SHARE_URL_MAX_ITEMS) return null;
  const hash = await encodeShareHash(doc);
  if (hash.length - SHARE_HASH_PREFIX.length > MAX_SHARE_HASH_LENGTH) {
    return null;
  }
  return `${origin}${pathname}#${hash}`;
}

export async function canBuildShareUrl(doc: ShareDocumentV1): Promise<boolean> {
  if (doc.listens.length > SHARE_URL_MAX_ITEMS) return false;
  const hash = await encodeShareHash(doc);
  return hash.length - SHARE_HASH_PREFIX.length <= MAX_SHARE_HASH_LENGTH;
}

export function defaultCloudSize(resolvedLength: number): number {
  return Math.min(SHARE_URL_MAX_ITEMS, Math.max(1, resolvedLength));
}

export function recipientSourceLabel(doc: ShareDocumentV1): string {
  const label = doc.sourceLabel.trim();
  if (!label) return "shared cloud";
  if (label.toLowerCase().startsWith("shared")) return label;
  return `shared · ${label}`;
}

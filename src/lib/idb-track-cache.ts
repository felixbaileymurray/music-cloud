import { trackPreviewCacheDbName } from "@/lib/app-id";
import type { TrackPreviewMatch } from "@/lib/types";

const DB_NAME = trackPreviewCacheDbName();
const STORE = "previews";
const VERSION = 1;

export type StoredTrackPreview = TrackPreviewMatch;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isStoredTrackPreview(value: unknown): value is StoredTrackPreview {
  if (!value || typeof value !== "object") return false;
  const row = value as StoredTrackPreview;
  return (
    typeof row.coverUrl === "string" &&
    typeof row.track === "string" &&
    typeof row.artist === "string" &&
    Array.isArray(row.clips) &&
    row.clips.length > 0
  );
}

export async function idbTrackGet(
  key: string
): Promise<StoredTrackPreview | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => {
      const value = request.result;
      resolve(isStoredTrackPreview(value) ? value : undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbTrackSet(key: string, value: StoredTrackPreview) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function trackCacheKey(track: string, artist: string) {
  return `${artist.toLowerCase()}:::${track.toLowerCase()}`;
}

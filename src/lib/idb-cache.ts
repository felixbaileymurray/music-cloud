import { previewCacheDbName } from "@/lib/app-id";
import type { PreviewMatch } from "@/lib/types";

const DB_NAME = previewCacheDbName();
const STORE = "previews";
// Bump when preview selection / clip identity changes so stale URLs are dropped.
const VERSION = 3;

export type StoredPreview = PreviewMatch;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isStoredPreview(value: unknown): value is StoredPreview {
  if (!value || typeof value !== "object") return false;
  const row = value as StoredPreview;
  return (
    typeof row.coverUrl === "string" &&
    typeof row.album === "string" &&
    typeof row.artist === "string" &&
    Array.isArray(row.clips) &&
    row.clips.length > 0
  );
}

export async function idbGet(key: string): Promise<StoredPreview | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => {
      const value = request.result;
      resolve(isStoredPreview(value) ? value : undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet(key: string, value: StoredPreview) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

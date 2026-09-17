const DB_NAME = "music-cloud-preview-cache";
const STORE = "previews";
const VERSION = 2;

export type StoredPreview = {
  coverUrl: string;
  previews: string[];
  album: string;
  artist: string;
};

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

export async function idbGet(key: string): Promise<StoredPreview | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => {
      const value = request.result as StoredPreview | null | undefined;
      // Ignore legacy negative cache entries.
      resolve(value && typeof value === "object" ? value : undefined);
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

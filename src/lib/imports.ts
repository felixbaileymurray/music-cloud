import type { Track } from "@/lib/types";

const DB_NAME = "music-cloud";
const STORE = "imports";

export type ImportedRecord = {
  id: string;
  title: string;
  duration: number;
  mimeType: string;
  blob: Blob;
  createdAt: number;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listImports(): Promise<ImportedRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      const rows = (request.result as ImportedRecord[]).sort(
        (a, b) => a.createdAt - b.createdAt
      );
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveImports(files: File[]) {
  const db = await openDb();
  const saved: ImportedRecord[] = [];
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    files.forEach((file) => {
      const record: ImportedRecord = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ""),
        duration: 0,
        mimeType: file.type || "audio/mpeg",
        blob: file,
        createdAt: Date.now(),
      };
      store.put(record);
      saved.push(record);
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return saved;
}

export async function clearImports() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function recordsToTracks(
  records: ImportedRecord[],
  urls: Map<string, string>
): Track[] {
  return records.map((record) => ({
    id: record.id,
    albumId: "imported",
    title: record.title,
    duration: record.duration,
    src: urls.get(record.id) ?? "",
    imported: true,
  }));
}

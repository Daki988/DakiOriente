import type { ProjectRecord } from "./types";

// Les projets sont gardés dans le navigateur (IndexedDB), rien n'est envoyé en ligne.
const DB = "atelier";
const STORE = "projects";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export const listProjects = async () =>
  (await run<ProjectRecord[]>("readonly", (s) => s.getAll())).sort((a, b) => b.updatedAt - a.updatedAt);
export const saveProject = (p: ProjectRecord) => run<IDBValidKey>("readwrite", (s) => s.put(p));
export const deleteProject = (id: string) => run<undefined>("readwrite", (s) => s.delete(id));

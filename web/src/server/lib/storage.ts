// Stockage des fichiers déposés (documents, photos d'annonces, PDF générés).
// Netlify : Netlify Blobs. Serveur Node (cPanel, VPS) et local : dossier STORAGE_DIR (défaut .data/uploads),
// à placer hors du dossier public du site.
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), ".data", "uploads"));
/** Clé valide : segments [A-Za-z0-9._-], sans « .. », ni barre oblique inverse, ni chemin absolu. */
export const cleValide = (key: string) => /^[\w-]+(\/[\w.-]+)*$/.test(key) && !key.split("/").some((s) => s === "." || s === "..");
/** Chemin sur disque d'une clé, sans possibilité de sortir du dossier de stockage. */
const chemin = (key: string) => {
  if (!cleValide(key)) throw new Error("Clé de fichier invalide");
  const p = path.resolve(LOCAL, key);
  if (!p.startsWith(LOCAL + path.sep)) throw new Error("Clé de fichier invalide");
  return p;
};
const blobsEnabled = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) && process.env.STORAGE !== "local";

async function store() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "navigoal-files", consistency: "strong" });
}

export async function putFile(key: string, data: Uint8Array | ArrayBuffer, contentType: string) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (blobsEnabled()) {
    await (await store()).set(key, new Blob([buf as BlobPart], { type: contentType }), { metadata: { contentType } });
  } else {
    const p = chemin(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buf);
    await fs.writeFile(p + ".meta", contentType);
  }
  return key;
}

export async function getFile(key: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  if (blobsEnabled()) {
    const r = await (await store()).getWithMetadata(key, { type: "arrayBuffer" });
    if (!r) return null;
    return { data: new Uint8Array(r.data as ArrayBuffer), contentType: String(r.metadata?.contentType ?? "application/octet-stream") };
  }
  try {
    const p = chemin(key);
    return { data: new Uint8Array(await fs.readFile(p)), contentType: await fs.readFile(p + ".meta", "utf8").catch(() => "application/octet-stream") };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string) {
  if (blobsEnabled()) await (await store()).delete(key);
  else await fs.rm(chemin(key), { force: true });
}

export const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_SIZE = 8 * 1024 * 1024;

/** Contrôle du type réel du fichier (signature) : refuse les fichiers déguisés. */
export function sniffMime(b: Uint8Array): string | null {
  const s = (i: number, ...xs: number[]) => xs.every((x, k) => b[i + k] === x);
  if (s(0, 0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (s(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (s(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (s(0, 0x52, 0x49, 0x46, 0x46) && s(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

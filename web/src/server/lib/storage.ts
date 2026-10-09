// Stockage des fichiers déposés (documents, photos d'annonces, PDF générés).
// Production : Netlify Blobs. Local : dossier .data/uploads.
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = path.join(process.cwd(), ".data", "uploads");
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
    const p = path.join(LOCAL, key);
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
    const p = path.join(LOCAL, key);
    return { data: new Uint8Array(await fs.readFile(p)), contentType: await fs.readFile(p + ".meta", "utf8").catch(() => "application/octet-stream") };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string) {
  if (blobsEnabled()) await (await store()).delete(key);
  else await fs.rm(path.join(LOCAL, key), { force: true });
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

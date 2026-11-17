import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { DB_FILE, getDb, MODE_BLOBS, remplacerBase, UPLOAD_DIR } from "./db";
import { seedDemo } from "./demo";

/**
 * Persistance sur Netlify (NEAM_STOCKAGE=blobs).
 * Les fonctions Netlify n'ont pas de disque permanent et chaque requête peut tomber sur une instance différente.
 * La base SQLite est donc conservée comme un instantané dans Netlify Blobs :
 *  - `pret()` recharge l'instantané si une autre instance l'a modifié (contrôle par ETag) ;
 *  - `ecrire(fn)` applique la modification puis enregistre l'instantané seulement si personne ne l'a modifié
 *    entre-temps (écriture conditionnelle). En cas de conflit, on recharge et on rejoue la modification.
 * Hors Netlify (serveur classique), ces fonctions ne font rien de plus qu'un accès SQLite direct.
 * Adapté à un trafic modéré ; au-delà, passer à PostgreSQL.
 */

const CLE = "neam-transit.db";
const etat = globalThis as unknown as { __neamEtag?: string | null; __neamChargement?: Promise<void> | null };

async function magasin(nom = "neam-base") {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: nom, consistency: "strong" });
}

const fichierBase = async () => new Blob([new Uint8Array(await fs.readFile(DB_FILE))]);

async function charger() {
  const store = await magasin();
  const meta = await store.getMetadata(CLE);
  if (meta === null) {
    // Première utilisation : base vide (+ démo si demandée), enregistrée seulement si elle n'existe toujours pas.
    remplacerBase(null);
    if (process.env.NEAM_DEMO === "1") seedDemo(getDb());
    const r = await store.set(CLE, await fichierBase(), { onlyIfNew: true });
    etat.__neamEtag = r.modified ? (r.etag ?? null) : null;
    if (!r.modified) return charger();
    return;
  }
  if (meta.etag === etat.__neamEtag && globalThis.__neamDbPret) return;
  const entree = await store.getWithMetadata(CLE, { type: "arrayBuffer" });
  if (entree === null) return charger();
  remplacerBase(new Uint8Array(entree.data as ArrayBuffer));
  etat.__neamEtag = entree.etag ?? null;
  globalThis.__neamDbPret = true;
}

declare global {
  var __neamDbPret: boolean | undefined;
}

/** À appeler au début de chaque page, action ou route qui lit la base. */
export async function pret(): Promise<void> {
  if (!MODE_BLOBS) return;
  if (!etat.__neamChargement) {
    etat.__neamChargement = charger().finally(() => {
      etat.__neamChargement = null;
    });
  }
  return etat.__neamChargement;
}

/** Applique une modification de la base et la rend durable. */
export async function ecrire<T>(fn: () => T): Promise<T> {
  if (!MODE_BLOBS) return fn();
  for (let essai = 0; essai < 6; essai++) {
    await pret();
    const etagLu = etat.__neamEtag;
    const r = fn();
    const store = await magasin();
    const res = await store.set(CLE, await fichierBase(), etagLu ? { onlyIfMatch: etagLu } : { onlyIfNew: true });
    if (res.modified) {
      etat.__neamEtag = res.etag ?? null;
      return r;
    }
    // Conflit : une autre instance a écrit entre-temps → on recharge et on rejoue.
    etat.__neamEtag = null;
    globalThis.__neamDbPret = false;
    await new Promise((ok) => setTimeout(ok, 100 + Math.random() * 200));
  }
  throw new Error("Enregistrement impossible (trop de modifications simultanées). Réessayez.");
}

/* ───────── Documents justificatifs ───────── */

export async function sauverDocument(nom: string, contenu: Uint8Array) {
  if (MODE_BLOBS) {
    await (await magasin("neam-documents")).set(nom, new Blob([new Uint8Array(contenu)]));
    return;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, nom), contenu);
}

export async function lireDocument(nom: string): Promise<Uint8Array | null> {
  if (MODE_BLOBS) {
    const data = await (await magasin("neam-documents")).get(nom, { type: "arrayBuffer" });
    return data ? new Uint8Array(data) : null;
  }
  return fs.readFile(path.join(UPLOAD_DIR, path.basename(nom))).then((b) => new Uint8Array(b)).catch(() => null);
}

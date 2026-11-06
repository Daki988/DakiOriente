// Dossier de candidature : catalogue des pièces, liste exigée par chaque école et formation,
// fiche de candidature de l'école (PDF à télécharger, remplir et renvoyer), pièces manquantes, dossier en ZIP.
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import fichesRef from "@/data/fiches_candidature.json";
import { db, schema } from "../db";
import { AppError, notFound } from "../lib/errors";
import { getFile, putFile, deleteFile, sniffMime, MAX_SIZE } from "../lib/storage";
import { assertMember } from "./establishments";
import { DOC_LABEL } from "./documents";
import { zip } from "../lib/zip";

type User = typeof schema.users.$inferSelect;
type DocType = (typeof schema.documentTypeEnum.enumValues)[number];
type Application = typeof schema.applications.$inferSelect;

/** Pièces que les écoles peuvent exiger à la candidature (ordre d'affichage). */
export const PIECES_CANDIDATURE: DocType[] = ["identite", "photo", "acte_naissance", "releve_notes", "releve_bac", "diplome", "cv", "lettre_motivation", "prise_en_charge", "test_langue", "attestation_scolarite", "certificat"];
/** Pièces demandées seulement à l'inscription définitive, après l'admission. */
export const PIECES_INSCRIPTION: DocType[] = ["equivalence_bac", "certificat_medical"];
/** Liste standard Navigoal quand l'école n'a rien précisé (le diplôme du bac est demandé dès qu'il est obtenu). */
export const STANDARD: DocType[] = ["identite", "photo", "acte_naissance", "releve_notes"];

/** Une pièce exigée : un type du catalogue, la fiche remplie de l'école, ou une pièce ajoutée par l'école. */
export type PieceRequise = { code: string; libelle: string; obligatoire: boolean; type: DocType; scope: string | null; ecole: boolean };
type FicheRef = { etablissement: string; fichier: string; source: string; date: string; nom: string };
const FICHES_REF = Object.fromEntries((fichesRef as { items: FicheRef[] }).items.map((f) => [f.etablissement, f])) as Record<string, FicheRef>;

/** Fiche de candidature d'une école : celle mise en ligne par l'école, sinon celle relevée sur son site officiel. */
export function ficheDe(e: { id: string; dossier: schema.DossierEcole }) {
  const f = e.dossier?.fiche;
  if (f) return { nom: f.nom, taille: f.taille, maj: f.maj, source: f.source ?? null, url: `/api/etablissements/${e.id}/fiche-candidature.pdf`, ecole: true };
  const r = FICHES_REF[e.id];
  return r ? { nom: r.nom, taille: null, maj: r.date, source: r.source, url: `/fiches/${r.fichier}`, ecole: false } : null;
}

export function piecesRequises(e: { id: string; sigle: string; dossier: schema.DossierEcole }, types: string[], demandees: string[] = []): PieceRequise[] {
  const out: PieceRequise[] = [];
  if (ficheDe(e)) out.push({ code: `fiche:${e.id}`, libelle: `Fiche de candidature ${e.sigle}, remplie et signée`, obligatoire: true, type: "fiche_candidature", scope: `etab:${e.id}`, ecole: true });
  for (const t of [...new Set([...types, ...demandees])]) {
    if (t.startsWith("piece:") || t.startsWith("fiche:")) continue;
    out.push({ code: t, libelle: DOC_LABEL[t as DocType] ?? t, obligatoire: true, type: t as DocType, scope: null, ecole: false });
  }
  for (const p of e.dossier?.pieces ?? []) out.push({ code: `piece:${e.id}:${p.cle}`, libelle: p.libelle, obligatoire: p.obligatoire || demandees.includes(`piece:${e.id}:${p.cle}`), type: "autre", scope: `piece:${e.id}:${p.cle}`, ecole: true });
  return out;
}

/** Une pièce est fournie si un document du bon type (et du bon rattachement pour les pièces propres à l'école) est joint. */
export function estFournie(p: PieceRequise, docs: { type: string; scope: string | null }[]) {
  return docs.some((d) => d.type === p.type && (p.scope ? d.scope === p.scope : true));
}

export async function piecesDeCandidature(a: Application) {
  const [row] = await db.select({ p: schema.programs, e: schema.establishments }).from(schema.programs).innerJoin(schema.establishments, eq(schema.establishments.id, schema.programs.establishmentId)).where(eq(schema.programs.id, a.programId));
  const pieces = piecesRequises(row.e, row.p.requiredDocuments, a.requestedDocuments);
  const docs = a.documentIds.length ? await db.select({ type: schema.documents.type, scope: schema.documents.scope }).from(schema.documents).where(inArray(schema.documents.id, a.documentIds)) : [];
  return { pieces, manquantes: pieces.filter((p) => p.obligatoire && !estFournie(p, docs)) };
}

/** Dossier public d'une formation (ou de l'école) : pièces à joindre, pièces de l'inscription, fiche à télécharger. */
export async function dossierPublic(eid: string, programId?: string | null) {
  const [e] = await db.select({ id: schema.establishments.id, sigle: schema.establishments.sigle, dossier: schema.establishments.dossier }).from(schema.establishments).where(eq(schema.establishments.id, eid));
  if (!e) throw notFound("Établissement");
  let types = STANDARD as string[];
  if (programId) {
    const [p] = await db.select({ r: schema.programs.requiredDocuments }).from(schema.programs).where(and(eq(schema.programs.id, programId), eq(schema.programs.establishmentId, eid)));
    if (p) types = p.r;
  }
  return {
    pieces: piecesRequises(e, types).map(({ code, libelle, obligatoire, ecole }) => ({ code, libelle, obligatoire, ecole })),
    inscription: PIECES_INSCRIPTION.map((t) => DOC_LABEL[t]).concat("Originaux du bac et des relevés de notes"),
    fiche: ficheDe(e),
  };
}

// ---------------------------------------------------------------- Réglages de l'école
const pieceSchema = z.object({ cle: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(), libelle: z.string().trim().min(2).max(120), obligatoire: z.boolean() });
export const reglagesSchema = z.object({
  types: z.array(z.enum(schema.documentTypeEnum.enumValues)).max(20),
  pieces: z.array(pieceSchema).max(10),
  appliquer: z.boolean().default(true),
});
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "piece";

export async function reglagesDossier(user: User, eid: string) {
  await assertMember(user, eid);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, eid));
  const progs = await db.select({ r: schema.programs.requiredDocuments }).from(schema.programs).where(eq(schema.programs.establishmentId, eid));
  // Liste la plus fréquente parmi les formations : sert de réglage par défaut.
  const freq = new Map<string, number>();
  for (const p of progs) { const k = JSON.stringify(p.r); freq.set(k, (freq.get(k) ?? 0) + 1); }
  const types = freq.size ? JSON.parse([...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]) : STANDARD;
  return { types, pieces: e.dossier?.pieces ?? [], fiche: ficheDe(e), catalogue: PIECES_CANDIDATURE.map((t) => [t, DOC_LABEL[t]]), inscription: PIECES_INSCRIPTION.map((t) => DOC_LABEL[t]), formations: progs.length, listesDifferentes: freq.size > 1 };
}

export async function enregistrerReglages(user: User, eid: string, raw: unknown) {
  await assertMember(user, eid);
  const i = reglagesSchema.parse(raw);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, eid));
  const vues = new Set<string>();
  const pieces = i.pieces.map((p) => { let c = p.cle ?? slug(p.libelle); while (vues.has(c)) c = `${c}-2`; vues.add(c); return { cle: c, libelle: p.libelle, obligatoire: p.obligatoire }; });
  await db.update(schema.establishments).set({ dossier: { ...e.dossier, pieces } }).where(eq(schema.establishments.id, eid));
  if (i.appliquer) await db.update(schema.programs).set({ requiredDocuments: i.types }).where(eq(schema.programs.establishmentId, eid));
  return reglagesDossier(user, eid);
}

export async function deposerFiche(user: User, eid: string, f: { name: string; bytes: Uint8Array }) {
  await assertMember(user, eid);
  if (f.bytes.byteLength > MAX_SIZE) throw new AppError("Fichier trop volumineux (8 Mo maximum).");
  if (sniffMime(f.bytes) !== "application/pdf") throw new AppError("La fiche de candidature doit être un fichier PDF.");
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, eid));
  const key = `fiches/${eid}-${Date.now()}.pdf`;
  await putFile(key, f.bytes, "application/pdf");
  if (e.dossier?.fiche?.key) await deleteFile(e.dossier.fiche.key).catch(() => undefined);
  const fiche: schema.FicheCandidature = { key, nom: f.name.replace(/[^\w .()'-]/g, "_").slice(0, 120) || "fiche.pdf", taille: f.bytes.byteLength, maj: new Date().toISOString().slice(0, 10), source: null, telechargements: 0 };
  await db.update(schema.establishments).set({ dossier: { ...e.dossier, fiche } }).where(eq(schema.establishments.id, eid));
  return reglagesDossier(user, eid);
}

export async function retirerFiche(user: User, eid: string) {
  await assertMember(user, eid);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, eid));
  if (e.dossier?.fiche?.key) await deleteFile(e.dossier.fiche.key).catch(() => undefined);
  await db.update(schema.establishments).set({ dossier: { ...e.dossier, fiche: null } }).where(eq(schema.establishments.id, eid));
  return reglagesDossier(user, eid);
}

/** Téléchargement public de la fiche mise en ligne par l'école (compteur de téléchargements). */
export async function lireFiche(eid: string) {
  const [e] = await db.select({ dossier: schema.establishments.dossier, sigle: schema.establishments.sigle }).from(schema.establishments).where(eq(schema.establishments.id, eid));
  const f = e?.dossier?.fiche;
  if (!f) throw notFound("Fiche de candidature");
  const fichier = await getFile(f.key);
  if (!fichier) throw notFound("Fiche de candidature");
  await db.execute(sql`update establishments set dossier = jsonb_set(dossier, '{fiche,telechargements}', to_jsonb(coalesce((dossier->'fiche'->>'telechargements')::int, 0) + 1)) where id = ${eid}`);
  return { data: fichier.data, nom: `fiche-candidature-${e.sigle.replace(/[^\w-]/g, "")}.pdf` };
}

/** Tout le dossier d'une candidature en un ZIP, pour l'établissement destinataire (ou l'admin). */
export async function dossierZip(viewer: User, applicationId: string) {
  const [a] = await db.select().from(schema.applications).where(eq(schema.applications.id, applicationId));
  if (!a) throw notFound("Candidature");
  if (viewer.role !== "admin") await assertMember(viewer, a.establishmentId);
  if (a.status === "brouillon") throw notFound("Candidature");
  const [s] = await db.select({ f: schema.users.firstName, l: schema.users.lastName }).from(schema.users).where(eq(schema.users.id, a.studentId));
  const docs = a.documentIds.length ? await db.select().from(schema.documents).where(inArray(schema.documents.id, a.documentIds)) : [];
  const ext = (m: string) => ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[m] ?? "bin";
  const files: { name: string; data: Uint8Array }[] = [];
  const noms = new Set<string>();
  for (const d of docs) {
    const f = await getFile(d.storageKey);
    if (!f) continue;
    const base = slug(d.label || DOC_LABEL[d.type] || d.type);
    let n = `${base}.${ext(d.mime)}`, k = 2;
    while (noms.has(n)) n = `${base}-${k++}.${ext(d.mime)}`;
    noms.add(n); files.push({ name: n, data: f.data });
  }
  return { data: zip(files), nom: `dossier-${a.number}-${slug(`${s.f}-${s.l}`)}.zip` };
}

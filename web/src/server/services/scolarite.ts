// Paiement de la scolarité, montage A (novembre 2026, docs/specs/2026-11-chantiers-fonctionnels.md, chantier 2).
// Navigoal n'encaisse rien : l'école déclare ses moyens de paiement officiels (affichés seulement une fois vérifiés par
// l'équipe, contre les faux RIB), fixe l'échéancier d'une candidature acceptée ; la famille paie l'école directement,
// dépose sa preuve ; l'école confirme la réception. Première échéance confirmée = inscription confirmée.
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { audit } from "../lib/audit";
import { notify } from "./notifications";
import { assertMember } from "./establishments";
import { notifySchool } from "./applications";
import { guardiansOf, isGuardianOf } from "./guardians";
import { etabById } from "@/lib/data";

type User = typeof schema.users.$inferSelect;
const JOUR = 864e5;
const M = schema.moyensPaiementEcoles, E = schema.echeanciersScolarite, P = schema.paiementsScolarite;
const sigle = (eid: string) => etabById[eid]?.sigle || etabById[eid]?.nom || "L'école";
const admins = () => db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")));

/** Prévient l'élève et ses parents liés (liens vers leurs espaces respectifs). */
async function prevenirFamille(eleveId: string, n: { title: string; body?: string; applicationId: string }) {
  await notify(eleveId, { kind: "scolarite", title: n.title, body: n.body, link: `/espace/candidatures/${n.applicationId}/#scolarite` });
  const [e] = await db.select({ p: schema.users.firstName }).from(schema.users).where(eq(schema.users.id, eleveId));
  for (const g of await guardiansOf(eleveId)) if (g.link.status === "actif" && g.parent?.id)
    await notify(g.parent.id, { kind: "scolarite", title: `${e?.p ?? "Votre enfant"} — ${n.title}`, body: n.body, link: `/parent/candidatures/${n.applicationId}/#scolarite` });
}

// ---------------------------------------------------------------- Moyens de paiement de l'école
export const moyenSchema = z.object({
  type: z.enum(["virement", "lien", "especes", "autre"]),
  libelle: z.string().trim().min(3).max(120),
  details: z.string().trim().min(5, "Coordonnées : RIB, lien ou instructions.").max(1500),
  devise: z.enum(["MAD", "XAF", "XOF", "EUR", "USD"]).default("MAD"),
});
export async function moyensEcole(user: User, eid: string) {
  await assertMember(user, eid);
  return db.select().from(M).where(and(eq(M.etablissementId, eid), inArray(M.statut, ["a_verifier", "verifie", "refuse"]))).orderBy(desc(M.createdAt));
}
/** Ajout ou modification : repasse toujours en vérification ; les familles en cours de paiement sont prévenues d'un changement. */
export async function enregistrerMoyen(user: User, eid: string, raw: unknown, id?: string) {
  await assertMember(user, eid);
  const i = moyenSchema.parse(raw);
  let m;
  if (id) {
    const [avant] = await db.select().from(M).where(and(eq(M.id, id), eq(M.etablissementId, eid)));
    if (!avant) throw notFound("Moyen de paiement");
    [m] = await db.update(M).set({ ...i, statut: "a_verifier", verifiePar: null, verifieLe: null }).where(eq(M.id, id)).returning();
    if (avant.statut === "verifie") {
      const ech = await db.select({ app: E.applicationId, eleve: schema.applications.studentId }).from(E).innerJoin(schema.applications, eq(schema.applications.id, E.applicationId)).where(eq(E.etablissementId, eid));
      for (const x of ech) await prevenirFamille(x.eleve, { title: `${sigle(eid)} a modifié ses coordonnées de paiement`, body: "Ne payez qu'avec les coordonnées affichées sur Navigoal après leur vérification par l'équipe. En cas de doute, écrivez-nous avant tout virement.", applicationId: x.app });
    }
  } else [m] = await db.insert(M).values({ ...i, etablissementId: eid }).returning();
  for (const a of await admins()) await notify(a.id, { kind: "scolarite", title: `Moyen de paiement à vérifier : ${sigle(eid)}`, link: "/admin/scolarite/" });
  await audit(user.id, id ? "moyen_paiement_modifie" : "moyen_paiement_ajoute", "moyen_paiement", m.id, { eid });
  return m;
}
export async function retirerMoyen(user: User, eid: string, id: string) {
  await assertMember(user, eid);
  await db.update(M).set({ statut: "retire" }).where(and(eq(M.id, id), eq(M.etablissementId, eid)));
}

// ---------------------------------------------------------------- Échéancier (école)
export const echeancierSchema = z.object({
  devise: z.enum(["MAD", "XAF", "XOF", "EUR", "USD"]).default("MAD"),
  lignes: z.array(z.object({ id: z.string().optional(), libelle: z.string().trim().min(3).max(120), montant: z.number().int().positive().max(5_000_000), echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).min(1).max(24),
  remboursement: z.string().trim().max(1500).optional().nullable(),
});
async function candidatureEcole(user: User, applicationId: string) {
  const [a] = await db.select().from(schema.applications).where(eq(schema.applications.id, applicationId));
  if (!a) throw notFound("Candidature");
  await assertMember(user, a.establishmentId);
  return a;
}
export async function definirEcheancier(user: User, applicationId: string, raw: unknown) {
  const a = await candidatureEcole(user, applicationId);
  if (a.status !== "acceptee") throw new AppError("L'échéancier se fixe une fois la candidature acceptée.");
  const i = echeancierSchema.parse(raw);
  const [avant] = await db.select().from(E).where(eq(E.applicationId, applicationId));
  const lignes = i.lignes.map((l) => ({ ...l, id: l.id || randomUUID() }));
  if (avant) {
    const payes = await db.select({ ligne: P.ligneId }).from(P).where(and(eq(P.echeancierId, avant.id), inArray(P.statut, ["declare", "confirme"])));
    // Une échéance déjà payée (ou déclarée) ne change plus : on peut seulement ajouter ou modifier les autres.
    for (const l of avant.lignes) if (payes.some((p) => p.ligne === l.id)) {
      const n = lignes.find((x) => x.id === l.id);
      if (!n || n.montant !== l.montant) throw new AppError(`« ${l.libelle} » a déjà un paiement : elle ne peut plus être retirée ni changer de montant.`);
    }
    if (avant.devise !== i.devise && payes.length) throw new AppError("La devise ne peut plus changer après un premier paiement.");
  }
  const valeurs = { devise: i.devise, lignes, remboursement: i.remboursement ?? null };
  const [e] = avant ? await db.update(E).set(valeurs).where(eq(E.id, avant.id)).returning()
    : await db.insert(E).values({ ...valeurs, applicationId, etablissementId: a.establishmentId, creePar: user.id }).returning();
  await audit(user.id, avant ? "echeancier_modifie" : "echeancier_cree", "application", applicationId, { lignes: lignes.length });
  await prevenirFamille(a.studentId, { title: avant ? `${sigle(a.establishmentId)} a mis à jour votre échéancier de scolarité` : `${sigle(a.establishmentId)} a fixé votre échéancier de scolarité`, body: "Montants, dates et moyens de paiement officiels de l'école dans votre candidature.", applicationId });
  return e;
}

/** Vue de l'échéancier : état de chaque échéance (payée, déclarée, à payer, en retard). */
async function vue(e: typeof E.$inferSelect, avecMoyensNonVerifies = false) {
  const paiements = await db.select({ p: P, payeur: { firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role } })
    .from(P).innerJoin(schema.users, eq(schema.users.id, P.payeurId)).where(eq(P.echeancierId, e.id)).orderBy(desc(P.createdAt));
  const moyens = await db.select().from(M).where(and(eq(M.etablissementId, e.etablissementId), avecMoyensNonVerifies ? inArray(M.statut, ["a_verifier", "verifie"]) : eq(M.statut, "verifie")));
  const auj = new Date().toISOString().slice(0, 10);
  const lignes = e.lignes.map((l) => {
    const ps = paiements.filter((x) => x.p.ligneId === l.id);
    const confirme = ps.filter((x) => x.p.statut === "confirme").reduce((s, x) => s + x.p.montant, 0);
    const declare = ps.filter((x) => x.p.statut === "declare").reduce((s, x) => s + x.p.montant, 0);
    const etat = confirme >= l.montant ? "payee" : declare + confirme >= l.montant ? "declaree" : l.echeance < auj ? "en_retard" : "a_payer";
    return { ...l, etat, confirme, declare, reste: Math.max(0, l.montant - confirme - declare) };
  });
  return { ...e, lignes, total: e.lignes.reduce((s, l) => s + l.montant, 0), paye: lignes.reduce((s, l) => s + l.confirme, 0), paiements: paiements.map(({ p, payeur }) => ({ ...p, payeur })), moyens: moyens.map((m) => ({ id: m.id, type: m.type, libelle: m.libelle, details: m.details, devise: m.devise, statut: m.statut })) };
}

export async function echeancierEcole(user: User, applicationId: string) {
  await candidatureEcole(user, applicationId);
  const [e] = await db.select().from(E).where(eq(E.applicationId, applicationId));
  return e ? vue(e, true) : null;
}

/** Paiements déclarés à confirmer et encaissements attendus de l'école. */
export async function tableauEcole(user: User, eid: string) {
  await assertMember(user, eid);
  const echs = await db.select({ e: E, eleve: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName }, programme: schema.programs.title })
    .from(E).innerJoin(schema.applications, eq(schema.applications.id, E.applicationId)).innerJoin(schema.users, eq(schema.users.id, schema.applications.studentId))
    .innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId)).where(eq(E.etablissementId, eid)).orderBy(desc(E.updatedAt));
  const vues = await Promise.all(echs.map(async (x) => ({ ...(await vue(x.e, true)), eleve: x.eleve, programme: x.programme })));
  return {
    aConfirmer: vues.flatMap((v) => v.paiements.filter((p) => p.statut === "declare").map((p) => ({ ...p, eleve: v.eleve, programme: v.programme, applicationId: v.applicationId, ligne: v.lignes.find((l) => l.id === p.ligneId)?.libelle ?? "" }))),
    echeanciers: vues.map((v) => ({ applicationId: v.applicationId, eleve: v.eleve, programme: v.programme, devise: v.devise, total: v.total, paye: v.paye, inscriptionConfirmee: v.inscriptionConfirmee, prochaine: v.lignes.find((l) => l.etat !== "payee") ?? null })),
  };
}

export async function confirmer(user: User, paiementId: string, raw: unknown) {
  const i = z.object({ statut: z.enum(["confirme", "refuse"]), motif: z.string().trim().max(500).optional() }).parse(raw);
  if (i.statut === "refuse" && !i.motif) throw new AppError("Indiquez le motif du refus : il est envoyé à la famille.");
  const [x] = await db.select({ p: P, e: E }).from(P).innerJoin(E, eq(E.id, P.echeancierId)).where(eq(P.id, paiementId));
  if (!x) throw notFound("Paiement");
  await assertMember(user, x.e.etablissementId);
  if (x.p.statut !== "declare") throw new AppError("Ce paiement a déjà été traité.");
  await db.update(P).set({ statut: i.statut, motif: i.motif ?? null, confirmePar: user.id, confirmeLe: new Date() }).where(eq(P.id, paiementId));
  const [a] = await db.select().from(schema.applications).where(eq(schema.applications.id, x.e.applicationId));
  if (i.statut === "confirme" && !x.e.inscriptionConfirmee) await db.update(E).set({ inscriptionConfirmee: new Date() }).where(eq(E.id, x.e.id));
  await audit(user.id, i.statut === "confirme" ? "paiement_scolarite_confirme" : "paiement_scolarite_refuse", "paiement_scolarite", paiementId, { montant: x.p.montant, devise: x.p.devise });
  const ligne = x.e.lignes.find((l) => l.id === x.p.ligneId)?.libelle ?? "échéance";
  await prevenirFamille(a.studentId, i.statut === "confirme"
    ? { title: `${sigle(x.e.etablissementId)} confirme la réception de votre paiement (${ligne})${x.e.inscriptionConfirmee ? "" : " : inscription confirmée"}`, applicationId: a.id }
    : { title: `${sigle(x.e.etablissementId)} n'a pas reçu votre paiement (${ligne})`, body: `Motif : ${i.motif}`, applicationId: a.id });
  if (x.p.payeurId !== a.studentId && !(await isGuardianOf(x.p.payeurId, a.studentId))) await notify(x.p.payeurId, { kind: "scolarite", title: `Paiement ${i.statut === "confirme" ? "confirmé" : "non reçu"} par ${sigle(x.e.etablissementId)}`, link: "/notifications" });
}

// ---------------------------------------------------------------- Famille
async function echeancierFamille(user: User, applicationId: string) {
  const [a] = await db.select().from(schema.applications).where(eq(schema.applications.id, applicationId));
  if (!a) throw notFound("Candidature");
  const ok = a.studentId === user.id || user.role === "admin" || (user.role === "parent" && (await isGuardianOf(user.id, a.studentId)));
  if (!ok) throw forbidden();
  const [e] = await db.select().from(E).where(eq(E.applicationId, applicationId));
  return { a, e };
}
export async function pourFamille(user: User, applicationId: string) {
  const { e } = await echeancierFamille(user, applicationId);
  return e ? vue(e) : null;
}

export const declarationSchema = z.object({
  ligneId: z.string().min(1), montant: z.number().int().positive().max(5_000_000), moyenId: z.string().min(1),
  reference: z.string().trim().max(120).optional().nullable(), preuveId: z.string().min(1, "Joignez la preuve de paiement (reçu, avis de virement)."),
});
/** La famille (élève ou parent garant) déclare un paiement fait à l'école, avec sa preuve. */
export async function declarer(user: User, applicationId: string, raw: unknown) {
  const { a, e } = await echeancierFamille(user, applicationId);
  if (!e) throw new AppError("L'école n'a pas encore fixé d'échéancier.");
  const i = declarationSchema.parse(raw);
  const l = e.lignes.find((x) => x.id === i.ligneId);
  if (!l) throw notFound("Échéance");
  const [m] = await db.select().from(M).where(and(eq(M.id, i.moyenId), eq(M.etablissementId, e.etablissementId), eq(M.statut, "verifie")));
  if (!m) throw new AppError("Moyen de paiement non vérifié : utilisez uniquement ceux affichés sur Navigoal.");
  const [d] = await db.select({ id: schema.documents.id }).from(schema.documents).where(and(eq(schema.documents.id, i.preuveId), eq(schema.documents.ownerId, user.id)));
  if (!d) throw new AppError("Preuve introuvable.");
  const [p] = await db.insert(P).values({ echeancierId: e.id, ligneId: l.id, payeurId: user.id, montant: i.montant, devise: e.devise, moyenId: m.id, reference: i.reference ?? null, preuveId: d.id }).returning();
  await audit(user.id, "paiement_scolarite_declare", "paiement_scolarite", p.id, { montant: i.montant, devise: e.devise });
  await notifySchool(e.etablissementId, `Paiement déclaré à confirmer : ${l.libelle}`, "/etablissement/scolarite/");
  if (user.id !== a.studentId) await notify(a.studentId, { kind: "scolarite", title: `Votre parent a déclaré un paiement : ${l.libelle}`, link: `/espace/candidatures/${a.id}/#scolarite` });
  return p;
}

/** L'école d'un paiement peut lire la preuve déposée (contrôle d'accès des documents). */
export async function preuveVisiblePar(viewerId: string, docId: string) {
  const r = await db.select({ eid: E.etablissementId }).from(P).innerJoin(E, eq(E.id, P.echeancierId))
    .innerJoin(schema.establishmentMembers, and(eq(schema.establishmentMembers.establishmentId, E.etablissementId), eq(schema.establishmentMembers.userId, viewerId)))
    .where(eq(P.preuveId, docId)).limit(1);
  return r.length > 0;
}

// ---------------------------------------------------------------- Équipe
export async function moyensAdmin() {
  const lignes = await db.select().from(M).where(inArray(M.statut, ["a_verifier", "verifie", "refuse"])).orderBy(desc(M.updatedAt));
  return lignes.map((m) => ({ ...m, ecole: sigle(m.etablissementId) }));
}
export async function verifierMoyen(admin: User, id: string, raw: unknown) {
  const { statut } = z.object({ statut: z.enum(["verifie", "refuse"]) }).parse(raw);
  const [m] = await db.update(M).set({ statut, verifiePar: admin.id, verifieLe: new Date() }).where(eq(M.id, id)).returning();
  if (!m) throw notFound("Moyen de paiement");
  await audit(admin.id, "moyen_paiement_" + statut, "moyen_paiement", id, {});
  await notifySchool(m.etablissementId, statut === "verifie" ? `Moyen de paiement vérifié : « ${m.libelle} » est affiché aux familles` : `Moyen de paiement refusé : « ${m.libelle} » (contactez l'équipe Navigoal)`, "/etablissement/scolarite/");
}

/** Rappels J-15, J-7, J-1 avant chaque échéance non réglée, à l'élève et à ses parents ; une fois par palier. */
export async function rappelsScolarite(maintenant = new Date()) {
  let envoyes = 0;
  const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;
  const echs = await db.select({ e: E, eleve: schema.applications.studentId }).from(E).innerJoin(schema.applications, eq(schema.applications.id, E.applicationId)).where(eq(schema.applications.status, "acceptee"));
  for (const { e, eleve } of echs) {
    const v = await vue(e);
    for (const l of v.lignes) {
      if (l.etat === "payee" || l.etat === "declaree") continue;
      const reste = Math.ceil((new Date(`${l.echeance}T23:59:59Z`).getTime() - maintenant.getTime()) / JOUR);
      const palier = reste === 1 || reste === 0 ? "j1" : reste > 1 && reste <= 7 ? "j7" : reste > 7 && reste <= 15 ? "j15" : null;
      if (!palier || !(await premiereFois(`scolarite:${e.id}:${l.id}:${palier}`))) continue;
      await prevenirFamille(eleve, { title: `${l.libelle} (${sigle(e.etablissementId)}) : échéance ${reste <= 1 ? "demain" : `dans ${reste} jours`}`, body: `${l.reste.toLocaleString("fr-FR")} ${e.devise} à régler directement à l'école, puis déposer la preuve sur Navigoal.`, applicationId: e.applicationId });
      envoyes++;
    }
  }
  return { envoyes };
}

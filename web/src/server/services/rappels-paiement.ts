// Rappels de paiement (novembre 2026) : un parent (ou l'élève) programme un rappel avant chaque échéance de loyer ou de
// scolarité, y compris pour un logement ou une école payés hors Navigoal. Délai réglable (2, 3, 5 ou 7 jours avant),
// rappel le jour même en option. Envoi par notification et e-mail, chaque jour par la tâche rappels-offres.
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { notify } from "./notifications";
import { childrenOf, isGuardianOf } from "./guardians";
import { DELAIS, FREQUENCES, aujourdhuiIso, ecartJours, prochaineEcheance, rappelsDuJour } from "@/lib/rappels";
import { etabById } from "@/lib/data";

type User = typeof schema.users.$inferSelect;
const R = schema.rappelsPaiement;
const ROLES = ["parent", "eleve", "etudiant"];
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.");

export const rappelSchema = z.object({
  type: z.enum(["loyer", "scolarite", "autre"]),
  libelle: z.string().trim().min(2, "Donnez un nom au rappel (ex. : Loyer du studio).").max(120),
  enfantId: z.string().optional().nullable(),
  montant: z.number().int().positive().max(100_000_000).optional().nullable(),
  devise: z.enum(["MAD", "XAF", "XOF", "EUR", "USD", "TND"]).default("MAD"),
  frequence: z.enum(Object.keys(FREQUENCES) as [keyof typeof FREQUENCES, ...(keyof typeof FREQUENCES)[]]).default("mensuel"),
  premiereEcheance: DATE,
  finLe: DATE.optional().nullable(),
  delaiJours: z.number().int().refine((d) => (DELAIS as readonly number[]).includes(d), "Délai : 2, 3, 5 ou 7 jours."),
  aussiLeJour: z.boolean().default(true),
  source: z.enum(["manuel", "navilease", "echeancier"]).default("manuel"),
  sourceId: z.string().optional().nullable(),
  actif: z.boolean().default(true),
});

async function verifierEnfant(user: User, enfantId?: string | null) {
  if (!enfantId) return null;
  if (user.role !== "parent" || !(await isGuardianOf(user.id, enfantId))) throw forbidden();
  return enfantId;
}

/** Échéances non réglées d'un échéancier de scolarité (dates AAAA-MM-JJ, montant, libellé). */
async function lignesEcheancier(echeancierId: string) {
  const [e] = await db.select().from(schema.echeanciersScolarite).where(eq(schema.echeanciersScolarite.id, echeancierId));
  if (!e) return null;
  const confirmes = await db.select({ ligne: schema.paiementsScolarite.ligneId, montant: schema.paiementsScolarite.montant })
    .from(schema.paiementsScolarite).where(and(eq(schema.paiementsScolarite.echeancierId, e.id), inArray(schema.paiementsScolarite.statut, ["confirme", "declare"])));
  return { e, lignes: e.lignes.filter((l) => confirmes.filter((c) => c.ligne === l.id).reduce((s, c) => s + c.montant, 0) < l.montant) };
}

/** Prochaine échéance d'un rappel (pour l'affichage et l'envoi) : { date, montant, libelle } ou null. */
async function prochaine(r: typeof R.$inferSelect, auj: string) {
  if (r.source === "echeancier" && r.sourceId) {
    const x = await lignesEcheancier(r.sourceId);
    const l = x?.lignes.filter((l) => l.echeance >= auj).sort((a, b) => a.echeance.localeCompare(b.echeance))[0];
    return l ? { date: l.echeance, montant: l.montant, devise: x!.e.devise, detail: l.libelle } : null;
  }
  const d = prochaineEcheance(r, auj);
  return d ? { date: d, montant: r.montant, devise: r.devise, detail: null as string | null } : null;
}

/** Rappels de l'utilisateur, avec la prochaine échéance, ses enfants (parent) et des suggestions à suivre en un clic. */
export async function mesRappels(user: User) {
  if (!ROLES.includes(user.role)) throw forbidden();
  const auj = aujourdhuiIso();
  const lignes = await db.select().from(R).where(eq(R.userId, user.id)).orderBy(R.createdAt);
  const enfants = user.role === "parent" ? (await childrenOf(user.id)).filter((c) => c.link.status === "actif").map((c) => ({ id: c.child.id, prenom: c.child.firstName })) : [];
  const prenom = (id: string | null) => enfants.find((e) => e.id === id)?.prenom ?? null;
  const rappels = await Promise.all(lignes.map(async (r) => ({ ...r, enfant: prenom(r.enfantId), prochaine: await prochaine(r, auj) })));
  // Suggestions : loyers Navilease et échéanciers de scolarité de l'élève (ou des enfants) pas encore suivis.
  const personnes = user.role === "parent" ? enfants.map((e) => e.id) : [user.id];
  const suivis = new Set(lignes.filter((r) => r.sourceId).map((r) => `${r.source}:${r.sourceId}`));
  const suggestions: { source: "navilease" | "echeancier"; sourceId: string; type: "loyer" | "scolarite"; libelle: string; enfantId: string | null; montant: number | null; devise: string; frequence: string; premiereEcheance: string }[] = [];
  if (personnes.length) {
    const resas = await db.select().from(schema.bookings).where(and(inArray(schema.bookings.tenantId, personnes), inArray(schema.bookings.status, ["contrat_signe", "entree", "fonds_verses", "en_cours", "preavis"])));
    for (const b of resas) if (!suivis.has(`navilease:${b.id}`)) suggestions.push({ source: "navilease", sourceId: b.id, type: "loyer", libelle: "Loyer du logement Navilease", enfantId: user.role === "parent" ? b.tenantId : null, montant: b.rent, devise: b.currency, frequence: "mensuel", premiereEcheance: b.startDate.slice(0, 10) });
    const echs = await db.select({ e: schema.echeanciersScolarite, eleve: schema.applications.studentId }).from(schema.echeanciersScolarite)
      .innerJoin(schema.applications, eq(schema.applications.id, schema.echeanciersScolarite.applicationId)).where(inArray(schema.applications.studentId, personnes));
    for (const { e, eleve } of echs) if (!suivis.has(`echeancier:${e.id}`) && e.lignes.length) suggestions.push({ source: "echeancier", sourceId: e.id, type: "scolarite", libelle: `Scolarité ${etabById[e.etablissementId]?.sigle ?? ""}`.trim(), enfantId: user.role === "parent" ? eleve : null, montant: null, devise: e.devise, frequence: "unique", premiereEcheance: e.lignes[0].echeance });
  }
  for (const s of suggestions) (s as typeof s & { enfant: string | null }).enfant = prenom(s.enfantId);
  return { rappels, enfants, suggestions };
}

export async function creer(user: User, raw: unknown) {
  if (!ROLES.includes(user.role)) throw forbidden();
  const i = rappelSchema.parse(raw);
  const enfantId = await verifierEnfant(user, i.enfantId);
  if (i.finLe && i.finLe < i.premiereEcheance) throw new AppError("La date de fin précède la première échéance.");
  if (i.source !== "manuel") {
    if (!i.sourceId) throw new AppError("Source manquante.");
    const personnes = enfantId ? [enfantId] : [user.id];
    if (i.source === "echeancier") {
      const [ok] = await db.select({ id: schema.echeanciersScolarite.id }).from(schema.echeanciersScolarite).innerJoin(schema.applications, eq(schema.applications.id, schema.echeanciersScolarite.applicationId))
        .where(and(eq(schema.echeanciersScolarite.id, i.sourceId), inArray(schema.applications.studentId, personnes)));
      if (!ok) throw notFound("Échéancier");
    } else {
      const [ok] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(and(eq(schema.bookings.id, i.sourceId), inArray(schema.bookings.tenantId, personnes)));
      if (!ok) throw notFound("Réservation");
    }
  }
  const nb = (await db.select({ id: R.id }).from(R).where(eq(R.userId, user.id))).length;
  if (nb >= 30) throw new AppError("30 rappels au plus : supprimez ceux qui ne servent plus.");
  const [r] = await db.insert(R).values({ ...i, enfantId, userId: user.id }).returning();
  return r;
}

export async function modifier(user: User, id: string, raw: unknown) {
  const [avant] = await db.select().from(R).where(and(eq(R.id, id), eq(R.userId, user.id)));
  if (!avant) throw notFound("Rappel");
  const i = rappelSchema.partial().parse(raw);
  if (i.enfantId !== undefined) i.enfantId = await verifierEnfant(user, i.enfantId);
  delete i.source; delete i.sourceId; // l'origine d'un rappel ne change pas
  const [r] = await db.update(R).set(i).where(eq(R.id, id)).returning();
  return r;
}

export async function supprimer(user: User, id: string) {
  await db.delete(R).where(and(eq(R.id, id), eq(R.userId, user.id)));
}

const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;
const dateLongue = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmt = (n: number, dev: string) => `${n.toLocaleString("fr-FR").replace(/[  ]/g, " ")} ${dev === "XAF" || dev === "XOF" ? "F CFA" : dev}`;

/** Tâche quotidienne : rappel X jours avant (une fois, avec rattrapage) et le jour même si demandé. */
export async function envoyerRappels(maintenant = new Date()) {
  const auj = aujourdhuiIso(maintenant);
  let envoyes = 0;
  const actifs = await db.select({ r: R, u: { id: schema.users.id, role: schema.users.role } }).from(R).innerJoin(schema.users, eq(schema.users.id, R.userId)).where(eq(R.actif, true));
  const prenoms = new Map<string, string>();
  for (const { r, u } of actifs) {
    const p = await prochaine(r, auj);
    if (!p) continue;
    for (const moment of rappelsDuJour(p.date, auj, r.delaiJours, r.aussiLeJour)) {
      if (!(await premiereFois(`rappelpay:${r.id}:${p.date}:${moment}`))) continue;
      let qui = "";
      if (r.enfantId) {
        if (!prenoms.has(r.enfantId)) { const [e] = await db.select({ p: schema.users.firstName }).from(schema.users).where(eq(schema.users.id, r.enfantId)); prenoms.set(r.enfantId, e?.p ?? ""); }
        qui = prenoms.get(r.enfantId) ? ` (${prenoms.get(r.enfantId)})` : "";
      }
      const reste = ecartJours(auj, p.date);
      const quand = moment === "jour" ? "aujourd'hui" : reste === 1 ? "demain" : `dans ${reste} jours, le ${dateLongue(p.date)}`;
      const montant = p.montant ? ` : ${fmt(p.montant, p.devise)}` : "";
      await notify(u.id, {
        kind: "rappel_paiement",
        title: `${r.libelle}${qui} à régler ${quand}${montant}`,
        body: `${p.detail ? `${p.detail}. ` : ""}Rappel programmé ${r.delaiJours} jours avant chaque échéance. Vous pouvez le modifier ou l'arrêter à tout moment.`,
        link: u.role === "parent" ? "/parent/rappels/" : "/espace/rappels/",
      });
      envoyes++;
    }
  }
  return { envoyes };
}

/** Personnes qui ont réglé elles-mêmes les rappels d'un échéancier (le rappel automatique J-15/J-7/J-1 ne leur est pas envoyé). */
export async function rappelsPersonnelsEcheancier(echeancierId: string) {
  return new Set((await db.select({ u: R.userId }).from(R).where(and(eq(R.source, "echeancier"), eq(R.sourceId, echeancierId), eq(R.actif, true)))).map((x) => x.u));
}

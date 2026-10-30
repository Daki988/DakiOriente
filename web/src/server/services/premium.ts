// Offre Premium des établissements : filtres des candidatures (résultats, projet, financement), vivier de candidats
// consentants et campagnes de prospection relues par Navigoal. Côté élève : « Mes attentes », visibilité, invitations.
import { and, desc, eq, gte, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { sha256 } from "../auth/tokens";
import { AppError, forbidden, notFound } from "../lib/errors";
import { tauxDuJour } from "../lib/taux";
import { assertMember, myMembersOf } from "./establishments";
import { findOrCreateConversation } from "./messaging";
import { notify } from "./notifications";
import { isMinor } from "./accounts";
import { compatibilite, domaineById, etabById, formationById, metierById, serieById } from "@/lib/data";
import { devis, formationParDefaut } from "@/lib/devis";
import { nomPays } from "@/lib/pays-origine";
import { PRIX_PREMIUM_MAD } from "@/lib/premium";

type User = typeof schema.users.$inferSelect;
type Profile = typeof schema.profiles.$inferSelect;

// ---------------------------------------------------------------- Abonnement
export const estPremium = (e: { plan: string; premiumUntil: Date | null }) => e.plan === "premium" && (!e.premiumUntil || e.premiumUntil > new Date());

export async function assertPremium(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, establishmentId));
  if (!e) throw notFound("Établissement");
  if (user.role !== "admin" && !estPremium(e)) throw new AppError(`Fonction réservée à l'offre Premium (${PRIX_PREMIUM_MAD.toLocaleString("fr-FR")} MAD par an). Contactez l'équipe Navigoal pour l'activer.`, 402, "premium_requis");
  return e;
}

export async function premiumStatus(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const [e] = await db.select({ plan: schema.establishments.plan, premiumUntil: schema.establishments.premiumUntil }).from(schema.establishments).where(eq(schema.establishments.id, establishmentId));
  if (!e) throw notFound("Établissement");
  return { premium: estPremium(e), premiumUntil: e.premiumUntil, prix: PRIX_PREMIUM_MAD };
}

/** Activation (un an) ou arrêt par l'équipe Navigoal, après réception du règlement. */
export async function setPremium(admin: User, establishmentId: string, on: boolean) {
  if (admin.role !== "admin") throw forbidden();
  const fin = new Date(); fin.setFullYear(fin.getFullYear() + 1);
  const [e] = await db.update(schema.establishments).set(on ? { plan: "premium", premiumUntil: fin } : { plan: "gratuit", premiumUntil: null }).where(eq(schema.establishments.id, establishmentId)).returning();
  if (!e) throw notFound("Établissement");
  for (const m of await myMembersOf(establishmentId)) await notify(m, on
    ? { kind: "premium", title: "Offre Premium activée", body: `Filtres avancés, vivier de candidats et campagnes de prospection sont disponibles jusqu'au ${fin.toLocaleDateString("fr-FR")}.`, link: "/etablissement/vivier" }
    : { kind: "premium", title: "Offre Premium désactivée", link: "/etablissement" });
  await audit(admin.id, on ? "premium_active" : "premium_desactive", "establishment", establishmentId, { prix: PRIX_PREMIUM_MAD, jusqua: on ? fin.toISOString() : null });
  return e;
}

// ---------------------------------------------------------------- « Mes attentes » (élève)
export const MENTIONS = ["passable", "assez_bien", "bien", "tres_bien"] as const;
export const attentesSchema = z.object({
  serie: z.string().max(40).nullable().optional(),
  average: z.coerce.number().min(0).max(20).nullable().optional(),
  mention: z.enum(MENTIONS).nullable().optional(),
  bacYear: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 3).nullable().optional(),
  domain: z.string().max(60).nullable().optional(),
  targetJobs: z.array(z.string().max(80)).max(5).optional(),
  startYear: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 4).nullable().optional(),
  villes: z.array(z.string().max(60)).max(6).optional(),
  budgetAnnuel: z.coerce.number().min(0).max(1e10).nullable().optional(),
  devise: z.string().max(3).nullable().optional(),
  funding: z.object({ garant: z.boolean().optional(), bourse: z.boolean().optional(), pret: z.boolean().optional(), autofinance: z.boolean().optional() }).optional(),
  visibleToSchools: z.boolean().optional(),
});

async function profilDe(userId: string) {
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  if (p) return p;
  const [n] = await db.insert(schema.profiles).values({ userId }).onConflictDoNothing().returning();
  return n ?? (await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)))[0];
}

async function parentsActifs(childId: string) {
  return (await db.select({ p: schema.guardianships.parentId }).from(schema.guardianships).where(and(eq(schema.guardianships.childId, childId), eq(schema.guardianships.status, "actif")))).map((x) => x.p).filter((x): x is string => !!x);
}

export async function getAttentes(student: User) {
  if (!["eleve", "etudiant"].includes(student.role)) throw forbidden();
  const p = await profilDe(student.id);
  const mineur = isMinor(student.birthYear);
  return {
    serie: p.serie, average: p.average, mention: p.mention, bacYear: p.bacYear, averageVerified: !!p.averageVerifiedAt, domain: p.domain, targetJobs: p.targetJobs, startYear: p.startYear,
    villes: p.preferences.villes ?? [], budgetAnnuel: p.preferences.budgetAnnuel ?? null, devise: p.preferences.devise ?? "MAD", funding: p.funding,
    visibleToSchools: p.visibleToSchools, mineur, parentConsent: !!p.parentConsentVisibilityAt, parents: mineur ? (await parentsActifs(student.id)).length : 0,
    invitationsNonLues: (await db.select({ n: sql<number>`count(*)::int` }).from(schema.invitations).where(and(eq(schema.invitations.studentId, student.id), eq(schema.invitations.status, "envoyee"))))[0].n,
  };
}

export async function updateAttentes(student: User, raw: z.input<typeof attentesSchema>) {
  if (!["eleve", "etudiant"].includes(student.role)) throw forbidden();
  const i = attentesSchema.parse(raw);
  const p = await profilDe(student.id);
  const set: Partial<Profile> = {};
  if (i.serie !== undefined) set.serie = i.serie;
  if (i.average !== undefined && i.average !== p.average) { set.average = i.average; set.averageVerifiedAt = null; }
  if (i.mention !== undefined) set.mention = i.mention;
  if (i.bacYear !== undefined) set.bacYear = i.bacYear;
  if (i.domain !== undefined) set.domain = i.domain;
  if (i.targetJobs) set.targetJobs = i.targetJobs.filter((m) => metierById[m]);
  if (i.startYear !== undefined) set.startYear = i.startYear;
  if (i.funding) set.funding = i.funding;
  if (i.villes || i.budgetAnnuel !== undefined || i.devise !== undefined)
    set.preferences = { ...p.preferences, ...(i.villes ? { villes: i.villes } : {}), ...(i.budgetAnnuel !== undefined ? { budgetAnnuel: i.budgetAnnuel ?? undefined } : {}), ...(i.devise ? { devise: i.devise.toUpperCase() } : {}) };
  if (i.visibleToSchools !== undefined && i.visibleToSchools !== p.visibleToSchools) {
    set.visibleToSchools = i.visibleToSchools;
    set.visibleToSchoolsAt = i.visibleToSchools ? new Date() : null;
    set.parentConsentVisibilityAt = null;
    // Mineur : le parent lié doit confirmer avant toute visibilité auprès des écoles.
    if (i.visibleToSchools && isMinor(student.birthYear)) for (const parent of await parentsActifs(student.id))
      await notify(parent, { kind: "visibilite", title: `${student.firstName} souhaite être visible des établissements`, body: "Les écoles reconnues pourront l'inviter à candidater, sans voir son nom ni ses coordonnées tant qu'il n'a pas accepté. Votre accord est nécessaire.", link: "/parent/enfants", channels: ["app", "email"] });
    await audit(student.id, i.visibleToSchools ? "visibilite_ecoles_on" : "visibilite_ecoles_off", "user", student.id);
  }
  if (Object.keys(set).length) await db.update(schema.profiles).set(set).where(eq(schema.profiles.userId, student.id));
  return getAttentes(student);
}

/** Accord du parent pour la visibilité d'un enfant mineur (ou retrait). */
export async function parentVisibility(parent: User, childId: string, ok: boolean) {
  const liens = await db.select().from(schema.guardianships).where(and(eq(schema.guardianships.parentId, parent.id), eq(schema.guardianships.childId, childId), eq(schema.guardianships.status, "actif")));
  if (!liens.length) throw forbidden();
  await db.update(schema.profiles).set(ok ? { parentConsentVisibilityAt: new Date() } : { parentConsentVisibilityAt: null, visibleToSchools: false, visibleToSchoolsAt: null }).where(eq(schema.profiles.userId, childId));
  await notify(childId, { kind: "visibilite", title: ok ? "Ton parent a confirmé : les écoles peuvent t'inviter" : "Ton parent a retiré ta visibilité auprès des écoles", link: "/espace/profil" });
  await audit(parent.id, ok ? "visibilite_parent_ok" : "visibilite_parent_retrait", "user", childId);
}

/** Vérification par l'équipe Navigoal de la moyenne déclarée (sur le relevé de notes déposé). */
export async function verifyAverage(admin: User, userId: string, ok: boolean) {
  if (admin.role !== "admin") throw forbidden();
  await db.update(schema.profiles).set({ averageVerifiedAt: ok ? new Date() : null }).where(eq(schema.profiles.userId, userId));
  await audit(admin.id, ok ? "moyenne_verifiee" : "moyenne_non_verifiee", "user", userId);
}

// ---------------------------------------------------------------- Indicateurs (financement, adéquation)
export type Financement = "couvert" | "declare" | "partiel" | "inconnu";
export const FINANCEMENT_LABEL: Record<Financement, string> = { couvert: "Couvert", declare: "Déclaré", partiel: "Partiel", inconnu: "Non renseigné" };

/** Budget annuel en dirhams (saisi dans la monnaie de l'élève ; taux du jour, base MAD). */
const budgetMad = (p: Profile, taux: Record<string, number>) => {
  const b = p.preferences.budgetAnnuel;
  if (!b) return null;
  const d = (p.preferences.devise ?? "MAD").toUpperCase();
  return d === "MAD" ? b : taux[d] ? b / taux[d] : null;
};

/** Coût de la 1re année (scolarité + vie sur place), estimation basse du devis, en dirhams. */
const coutAnnuel = (eid: string, fid?: string | null) => {
  const e = etabById[eid];
  if (!e) return null;
  const f = fid && e.formations.includes(fid) ? fid : formationParDefaut(eid);
  return f ? devis(eid, f).rows[0].total[0] : null;
};

type Preuves = { garant: boolean; justificatif: boolean };
function financement(p: Profile, budget: number | null, cout: number | null, preuves: Preuves): { statut: Financement; preuve: string } {
  const preuve = preuves.garant ? "Garant vérifié" : preuves.justificatif ? "Justificatif validé" : p.funding.bourse ? "Bourse demandée" : p.funding.pret ? "Prêt demandé" : "Non vérifié";
  if (!budget) return { statut: p.funding.bourse || p.funding.pret ? "partiel" : "inconnu", preuve };
  if (cout && budget < cout) return { statut: "partiel", preuve };
  return { statut: preuves.garant || preuves.justificatif ? "couvert" : "declare", preuve };
}

/** Score d'adéquation (0-100) : résultats 35, série 15, projet 25, test d'orientation 10, financement 15. */
function adequation(p: Profile, pays: string | null, fid: string | null, fin: Financement) {
  const f = fid ? formationById[fid] : null;
  let s = p.average != null ? Math.max(0, Math.min(1, (p.average - 10) / 7)) * 35 : 10;
  const series = f && pays ? (f.series_recommandees as Record<string, string[] | undefined>)[pays] : undefined;
  s += !p.serie || !series ? 7 : series.includes(p.serie) ? 15 : 0;
  s += f && p.targetJobs.some((m) => f.metiers.includes(m)) ? 25 : f && p.domain === f.domaine ? 15 : 0;
  s += f && p.riasec?.top?.length ? (compatibilite(p.riasec.top, f.id) / 100) * 10 : 5;
  s += { couvert: 15, declare: 10, partiel: 6, inconnu: 0 }[fin];
  return Math.round(Math.min(100, s));
}

async function preuvesDe(ids: string[]) {
  if (!ids.length) return new Map<string, Preuves>();
  const g = await db.select({ c: schema.guardianships.childId }).from(schema.guardianships).where(and(inArray(schema.guardianships.childId, ids), eq(schema.guardianships.status, "actif")));
  const d = await db.select({ o: schema.documents.ownerId }).from(schema.documents).where(and(inArray(schema.documents.ownerId, ids), eq(schema.documents.type, "justificatif_ressources"), eq(schema.documents.status, "valide")));
  return new Map(ids.map((id) => [id, { garant: g.some((x) => x.c === id), justificatif: d.some((x) => x.o === id) }]));
}

const mentionLabel = (m: string | null) => ({ passable: "Passable", assez_bien: "Assez bien", bien: "Bien", tres_bien: "Très bien" } as Record<string, string>)[m ?? ""] ?? null;

// ---------------------------------------------------------------- Candidatures reçues filtrées (Premium)
export const filtreSchema = z.object({
  moyenneMin: z.coerce.number().min(0).max(20).optional(),
  series: z.array(z.string()).optional(),
  mentionMin: z.enum(MENTIONS).optional(),
  domaine: z.string().optional(),
  metier: z.string().optional(),
  programme: z.string().optional(),
  rentree: z.coerce.number().int().optional(),
  budgetCouvre: z.boolean().optional(),
  garant: z.boolean().optional(),
  justificatif: z.boolean().optional(),
  bourse: z.boolean().optional(),
});

export async function filteredApplications(user: User, establishmentId: string, raw: z.input<typeof filtreSchema>) {
  await assertPremium(user, establishmentId);
  const f = filtreSchema.parse(raw);
  const rows = await db.select({ a: schema.applications, prog: { id: schema.programs.id, title: schema.programs.title, formationId: schema.programs.formationId }, s: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country }, p: schema.profiles })
    .from(schema.applications).innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId)).innerJoin(schema.users, eq(schema.users.id, schema.applications.studentId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.applications.studentId))
    .where(and(eq(schema.applications.establishmentId, establishmentId), ne(schema.applications.status, "brouillon"), f.programme ? eq(schema.applications.programId, f.programme) : undefined))
    .orderBy(desc(schema.applications.submittedAt));
  const taux = (await tauxDuJour()).taux;
  const preuves = await preuvesDe([...new Set(rows.map((r) => r.s.id))]);
  const ordreMention = (m: string | null) => MENTIONS.indexOf((m ?? "") as (typeof MENTIONS)[number]);
  const items = rows.map(({ a, prog, s, p }) => {
    const pr = (p ?? { average: null, serie: null, mention: null, preferences: {}, funding: {}, targetJobs: [], domain: null, riasec: null, startYear: null, bacYear: null, averageVerifiedAt: null }) as Profile;
    const budget = budgetMad(pr, taux);
    const fin = financement(pr, budget, coutAnnuel(establishmentId, prog.formationId), preuves.get(s.id)!);
    return {
      id: a.id, number: a.number, status: a.status, submittedAt: a.submittedAt, programme: prog.title, formationId: prog.formationId,
      candidat: { ...s, pays: nomPays(s.country) },
      resultats: { moyenne: pr.average, verifiee: !!pr.averageVerifiedAt, mention: mentionLabel(pr.mention), mentionId: pr.mention, serie: pr.serie ? serieById[pr.serie]?.code ? `Bac ${serieById[pr.serie].code}` : pr.serie : null, serieId: pr.serie, annee: pr.bacYear },
      projet: { metiers: pr.targetJobs.map((m) => metierById[m]?.nom).filter(Boolean), metierIds: pr.targetJobs, domaine: pr.domain ? domaineById[pr.domain]?.libelle ?? pr.domain : null, domaineId: pr.domain, rentree: pr.startYear },
      financement: { statut: fin.statut, libelle: FINANCEMENT_LABEL[fin.statut], preuve: fin.preuve, garant: preuves.get(s.id)!.garant, justificatif: preuves.get(s.id)!.justificatif, bourse: !!pr.funding.bourse },
      score: adequation(pr, s.country, prog.formationId, fin.statut),
    };
  });
  const filtres = items.filter((x) =>
    (f.moyenneMin == null || (x.resultats.moyenne ?? -1) >= f.moyenneMin) &&
    (!f.series?.length || (x.resultats.serieId && f.series.includes(x.resultats.serieId))) &&
    (!f.mentionMin || ordreMention(x.resultats.mentionId) >= ordreMention(f.mentionMin)) &&
    (!f.domaine || x.projet.domaineId === f.domaine) &&
    (!f.metier || x.projet.metierIds.includes(f.metier)) &&
    (!f.rentree || x.projet.rentree === f.rentree) &&
    (!f.budgetCouvre || x.financement.statut === "couvert" || x.financement.statut === "declare") &&
    (!f.garant || x.financement.garant) && (!f.justificatif || x.financement.justificatif) && (!f.bourse || x.financement.bourse));
  return { total: items.length, items: filtres.sort((a, b) => b.score - a.score) };
}

// ---------------------------------------------------------------- Vivier de candidats (profils anonymes consentants)
export const vivierSchema = z.object({
  pays: z.array(z.string().max(3)).optional(),
  domaines: z.array(z.string()).optional(),
  metiers: z.array(z.string()).optional(),
  moyenneMin: z.coerce.number().min(0).max(20).optional(),
  budgetCouvre: z.boolean().optional(),
  rentree: z.coerce.number().int().optional(),
  villes: z.array(z.string()).optional(),
  refs: z.array(z.string().max(40)).max(50).optional(), // invitation ciblée depuis une carte
});
type VivierFiltre = z.infer<typeof vivierSchema>;
const refDe = (eid: string, uid: string) => sha256(`vivier:${eid}:${uid}`).slice(0, 20);

/** Élèves visibles : consentement de l'élève, et du parent s'il est mineur ; comptes actifs. */
async function visibles() {
  const an = new Date().getFullYear();
  return db.select({ u: schema.users, p: schema.profiles }).from(schema.profiles).innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
    .where(and(eq(schema.profiles.visibleToSchools, true), inArray(schema.users.role, ["eleve", "etudiant"]), eq(schema.users.status, "actif"),
      or(sql`${schema.users.birthYear} is null`, sql`${schema.users.birthYear} <= ${an - 18}`, isNotNull(schema.profiles.parentConsentVisibilityAt))));
}

async function selection(establishmentId: string, f: VivierFiltre) {
  const tous = await visibles();
  const taux = (await tauxDuJour()).taux;
  const cout = coutAnnuel(establishmentId);
  const items = tous.map(({ u, p }) => {
    const budget = budgetMad(p, taux);
    return { u, p, budget, couvre: !!budget && !!cout && budget >= cout };
  });
  const refs = f.refs?.length ? new Set(f.refs) : null;
  const ok = items.filter((x) =>
    (!refs || refs.has(refDe(establishmentId, x.u.id))) &&
    (!f.pays?.length || (x.u.country && f.pays.includes(x.u.country))) &&
    (!f.domaines?.length || (x.p.domain && f.domaines.includes(x.p.domain))) &&
    (!f.metiers?.length || x.p.targetJobs.some((m) => f.metiers!.includes(m))) &&
    (f.moyenneMin == null || (x.p.average ?? -1) >= f.moyenneMin) &&
    (!f.budgetCouvre || x.couvre) &&
    (!f.rentree || x.p.startYear === f.rentree) &&
    (!f.villes?.length || (x.p.preferences.villes ?? []).some((v) => f.villes!.includes(v))));
  return { tous: items, ok };
}

const tranche = (v: number | null | undefined) => (v == null ? null : `${Math.floor(v)} – ${Math.floor(v) + 1}`);
function budgetLisible(p: Profile) {
  const b = p.preferences.budgetAnnuel;
  if (!b) return null;
  const d = (p.preferences.devise ?? "MAD").toUpperCase();
  const u = d === "XAF" || d === "XOF" ? "F CFA" : d;
  return b >= 1e6 ? `≈ ${Math.round(b / 1e6)} M ${u}/an` : `≈ ${Math.round(b / 1000)} k ${u}/an`;
}

export async function vivier(user: User, establishmentId: string, raw: z.input<typeof vivierSchema>) {
  await assertPremium(user, establishmentId);
  const f = vivierSchema.parse(raw);
  const { tous, ok } = await selection(establishmentId, f);
  const interesses = await db.select({ u: schema.favorites.userId }).from(schema.favorites).where(and(eq(schema.favorites.kind, "etablissement"), eq(schema.favorites.itemId, establishmentId)));
  const recents = await contactesRecemment(establishmentId);
  const moy = ok.map((x) => x.p.average).filter((v): v is number => v != null).sort((a, b) => a - b);
  return {
    stats: { visibles: tous.length, correspondants: ok.length, budgetCouvre: ok.length ? Math.round((ok.filter((x) => x.couvre).length / ok.length) * 100) : 0, moyenneMediane: moy.length ? moy[Math.floor(moy.length / 2)] : null, interesses: ok.filter((x) => interesses.some((i) => i.u === x.u.id)).length },
    profils: ok.slice(0, 60).map(({ u, p, couvre }) => ({
      ref: refDe(establishmentId, u.id), statut: u.role === "eleve" ? "Élève" : "Étudiant", pays: nomPays(u.country),
      bac: [p.serie ? (serieById[p.serie]?.code ? `Bac ${serieById[p.serie].code}` : p.serie) : null, p.bacYear ? (p.bacYear > new Date().getFullYear() ? `attendu ${p.bacYear}` : String(p.bacYear)) : null].filter(Boolean).join(" · ") || null,
      moyenne: tranche(p.average), moyenneVerifiee: !!p.averageVerifiedAt,
      projet: [p.domain ? domaineById[p.domain]?.libelle ?? null : null, p.targetJobs.map((m) => metierById[m]?.nom).filter(Boolean).slice(0, 2).join(", ") || null].filter(Boolean).join(" · ") || null,
      budget: budgetLisible(p), couvre, villes: (p.preferences.villes ?? []).slice(0, 3), rentree: p.startYear,
      financement: p.funding.garant ? "Parent garant" : p.funding.bourse ? "Bourse recherchée" : p.funding.pret ? "Prêt étudiant" : p.funding.autofinance ? "Autofinancement" : null,
      interesse: interesses.some((i) => i.u === u.id), dejaContacte: recents.has(u.id),
    })),
  };
}

async function contactesRecemment(establishmentId: string) {
  const depuis = new Date(Date.now() - 30 * 86400000);
  const r = await db.select({ s: schema.invitations.studentId }).from(schema.invitations).where(and(eq(schema.invitations.establishmentId, establishmentId), gte(schema.invitations.createdAt, depuis)));
  return new Set(r.map((x) => x.s));
}

// ---------------------------------------------------------------- Campagnes de prospection
export const CREDITS_MENSUELS = 2000;
export const OFFRES = { candidature: "Invitation à candidater", portes_ouvertes: "Journée portes ouvertes", bourse: "Bourse ou réduction", concours: "Concours d'entrée" } as const;
export const prospectionSchema = z.object({
  offer: z.enum(Object.keys(OFFRES) as [keyof typeof OFFRES]),
  subject: z.string().trim().min(5).max(120),
  body: z.string().trim().min(20).max(2000),
  link: z.string().max(300).nullable().optional(),
  criteria: vivierSchema,
});

async function audience(establishmentId: string, criteria: VivierFiltre) {
  const { ok } = await selection(establishmentId, criteria);
  const recents = await contactesRecemment(establishmentId);
  return ok.filter((x) => !recents.has(x.u.id)).map((x) => x.u.id);
}

async function creditsUtilises(establishmentId: string) {
  const debut = new Date(); debut.setDate(1); debut.setHours(0, 0, 0, 0);
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.invitations).where(and(eq(schema.invitations.establishmentId, establishmentId), gte(schema.invitations.createdAt, debut)));
  return r.n;
}

export async function createProspection(user: User, establishmentId: string, raw: z.input<typeof prospectionSchema>) {
  const e = await assertPremium(user, establishmentId);
  const i = prospectionSchema.parse(raw);
  const lien = i.link?.trim() || null;
  if (lien && !/^\/[^/\\]/.test(lien) && !/^https:\/\/(www\.)?navigoal\.net\//.test(lien)) throw new AppError("Le lien doit mener à une page Navigoal (fiche de l'école ou de la formation).");
  const ids = await audience(establishmentId, i.criteria);
  if (!ids.length) throw new AppError("Aucun profil ne correspond à cette cible (ou tous ont déjà été contactés par votre école ces 30 derniers jours).");
  if ((await creditsUtilises(establishmentId)) + ids.length > CREDITS_MENSUELS) throw new AppError(`Crédits du mois insuffisants (${CREDITS_MENSUELS} envois par mois). Réduisez la cible.`);
  const [pr] = await db.insert(schema.prospections).values({ establishmentId, authorId: user.id, offer: i.offer, subject: i.subject, body: i.body, link: lien, criteria: i.criteria, audience: ids.length }).returning();
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")));
  for (const a of admins) await notify(a.id, { kind: "prospection", title: `Campagne de prospection à relire · ${e.sigle} (${ids.length} élèves)`, link: "/admin/prospection" });
  await audit(user.id, "prospection_creee", "prospection", pr.id, { audience: ids.length });
  return pr;
}

export async function audiencePreview(user: User, establishmentId: string, raw: z.input<typeof vivierSchema>) {
  await assertPremium(user, establishmentId);
  const ids = await audience(establishmentId, vivierSchema.parse(raw));
  const an = new Date().getFullYear();
  const mineurs = ids.length ? (await db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(and(inArray(schema.users.id, ids), sql`${schema.users.birthYear} > ${an - 18}`)))[0].n : 0;
  return { audience: ids.length, mineurs, creditsRestants: CREDITS_MENSUELS - (await creditsUtilises(establishmentId)) };
}

export async function listProspections(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const ps = await db.select().from(schema.prospections).where(eq(schema.prospections.establishmentId, establishmentId)).orderBy(desc(schema.prospections.createdAt));
  const stats = ps.length ? await db.select({ p: schema.invitations.prospectionId, s: schema.invitations.status, n: sql<number>`count(*)::int` }).from(schema.invitations).where(inArray(schema.invitations.prospectionId, ps.map((x) => x.id))).groupBy(schema.invitations.prospectionId, schema.invitations.status) : [];
  // Élèves intéressés : profil révélé (ils ont accepté), avec le fil de discussion ouvert.
  const interesses = ps.length ? await db.select({ p: schema.invitations.prospectionId, id: schema.invitations.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country, at: schema.invitations.respondedAt })
    .from(schema.invitations).innerJoin(schema.users, eq(schema.users.id, schema.invitations.studentId)).where(and(inArray(schema.invitations.prospectionId, ps.map((x) => x.id)), eq(schema.invitations.status, "interessee"))) : [];
  const convs = interesses.length ? await db.select({ id: schema.conversations.id, ctx: schema.conversations.contextId }).from(schema.conversations).where(and(eq(schema.conversations.contextKind, "invitation"), inArray(schema.conversations.contextId, interesses.map((x) => x.id)))) : [];
  const candidatures = await db.select({ n: sql<number>`count(distinct a.id)::int`, p: schema.invitations.prospectionId }).from(schema.invitations)
    .innerJoin(sql`applications a`, sql`a.student_id = ${schema.invitations.studentId} and a.establishment_id = ${schema.invitations.establishmentId} and a.status <> 'brouillon' and a.created_at >= ${schema.invitations.createdAt}`)
    .where(eq(schema.invitations.establishmentId, establishmentId)).groupBy(schema.invitations.prospectionId);
  return {
    creditsRestants: CREDITS_MENSUELS - (await creditsUtilises(establishmentId)),
    items: ps.map((p) => {
      const s = (st: string) => stats.find((x) => x.p === p.id && x.s === st)?.n ?? 0;
      const lus = s("lue") + s("interessee") + s("refusee");
      return { ...p, offreLibelle: OFFRES[p.offer as keyof typeof OFFRES] ?? p.offer, stats: { envoyes: p.status === "envoyee" ? lus + s("envoyee") : 0, lus, interesses: s("interessee"), refus: s("refusee"), candidatures: candidatures.find((c) => c.p === p.id)?.n ?? 0 },
        interesses: interesses.filter((x) => x.p === p.id).map((x) => ({ nom: `${x.firstName} ${x.lastName}`, pays: nomPays(x.country), conversation: convs.find((c) => c.ctx === x.id)?.id ?? null })) };
    }),
  };
}

/** Relecture par l'équipe Navigoal, puis envoi des invitations (messagerie Navigoal + e-mail de notification). */
export async function reviewProspection(admin: User, id: string, approve: boolean, note?: string) {
  if (admin.role !== "admin") throw forbidden();
  const [p] = await db.select().from(schema.prospections).where(eq(schema.prospections.id, id));
  if (!p) throw notFound("Campagne");
  if (p.status !== "en_validation") throw new AppError("Cette campagne a déjà été traitée.");
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, p.establishmentId));
  if (!approve) {
    await db.update(schema.prospections).set({ status: "refusee", reviewNote: note ?? null }).where(eq(schema.prospections.id, id));
    for (const m of await myMembersOf(p.establishmentId)) await notify(m, { kind: "prospection", title: `Campagne « ${p.subject} » non validée`, body: note, link: "/etablissement/prospection" });
    await audit(admin.id, "prospection_refusee", "prospection", id);
    return { envoyes: 0 };
  }
  const ids = await audience(p.establishmentId, p.criteria as VivierFiltre);
  if (ids.length) await db.insert(schema.invitations).values(ids.map((studentId) => ({ prospectionId: id, establishmentId: p.establishmentId, studentId }))).onConflictDoNothing();
  for (const s of ids) await notify(s, { kind: "invitation", title: `Invitation de ${e.nom}`, body: p.subject, link: "/espace/invitations", channels: ["app", "email"] });
  await db.update(schema.prospections).set({ status: "envoyee", reviewNote: note ?? null, sentAt: new Date(), audience: ids.length }).where(eq(schema.prospections.id, id));
  for (const m of await myMembersOf(p.establishmentId)) await notify(m, { kind: "prospection", title: `Campagne « ${p.subject} » envoyée à ${ids.length} élèves`, link: "/etablissement/prospection" });
  await audit(admin.id, "prospection_envoyee", "prospection", id, { envoyes: ids.length });
  return { envoyes: ids.length };
}

export async function listProspectionsAdmin(admin: User) {
  if (admin.role !== "admin") throw forbidden();
  return db.select({ p: schema.prospections, e: { id: schema.establishments.id, sigle: schema.establishments.sigle, nom: schema.establishments.nom } }).from(schema.prospections)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.prospections.establishmentId)).orderBy(desc(schema.prospections.createdAt)).limit(100);
}

// ---------------------------------------------------------------- Invitations (élève)
export async function myInvitations(student: User) {
  const rows = await db.select({ i: schema.invitations, p: { subject: schema.prospections.subject, body: schema.prospections.body, link: schema.prospections.link, offer: schema.prospections.offer }, e: { id: schema.establishments.id, nom: schema.establishments.nom, sigle: schema.establishments.sigle, logo: schema.establishments.logo, label: schema.establishments.label, ville: schema.establishments.ville } })
    .from(schema.invitations).innerJoin(schema.prospections, eq(schema.prospections.id, schema.invitations.prospectionId)).innerJoin(schema.establishments, eq(schema.establishments.id, schema.invitations.establishmentId))
    .where(eq(schema.invitations.studentId, student.id)).orderBy(desc(schema.invitations.createdAt)).limit(50);
  const nonLues = rows.filter((r) => r.i.status === "envoyee").map((r) => r.i.id);
  if (nonLues.length) await db.update(schema.invitations).set({ status: "lue" }).where(inArray(schema.invitations.id, nonLues));
  const convs = rows.length ? await db.select({ id: schema.conversations.id, ctx: schema.conversations.contextId }).from(schema.conversations).where(and(eq(schema.conversations.contextKind, "invitation"), inArray(schema.conversations.contextId, rows.map((r) => r.i.id)))) : [];
  return rows.map((r) => ({ ...r, offreLibelle: OFFRES[r.p.offer as keyof typeof OFFRES] ?? r.p.offer, nouvelle: nonLues.includes(r.i.id), conversation: convs.find((c) => c.ctx === r.i.id)?.id ?? null }));
}

export async function respondInvitation(student: User, id: string, interesse: boolean) {
  const [r] = await db.select({ i: schema.invitations, e: schema.establishments, subject: schema.prospections.subject }).from(schema.invitations)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.invitations.establishmentId)).innerJoin(schema.prospections, eq(schema.prospections.id, schema.invitations.prospectionId))
    .where(and(eq(schema.invitations.id, id), eq(schema.invitations.studentId, student.id)));
  if (!r) throw notFound("Invitation");
  await db.update(schema.invitations).set({ status: interesse ? "interessee" : "refusee", respondedAt: new Date() }).where(eq(schema.invitations.id, id));
  if (!interesse) return { conversation: null };
  // « Ça m'intéresse » : l'école voit le profil et peut écrire à l'élève dans la messagerie Navigoal.
  const members = await myMembersOf(r.e.id);
  const c = await findOrCreateConversation(`${r.e.sigle} · ${r.subject}`, [student.id, ...members], { kind: "invitation", id });
  for (const m of members) await notify(m, { kind: "prospection", title: `${student.firstName} ${student.lastName} est intéressé·e par votre invitation`, link: `/messages/${c.id}` });
  await audit(student.id, "invitation_interessee", "invitation", id);
  return { conversation: c.id };
}

/** « Ne plus être contacté par les écoles » : retrait immédiat du vivier. */
export async function stopContact(student: User) {
  await db.update(schema.profiles).set({ visibleToSchools: false, visibleToSchoolsAt: null, parentConsentVisibilityAt: null }).where(eq(schema.profiles.userId, student.id));
  await audit(student.id, "visibilite_ecoles_off", "user", student.id);
}

/** Pour un parent : visibilité de ses enfants auprès des écoles (accord à donner). */
export async function visibilityOfChildren(parent: User) {
  return db.select({ id: schema.users.id, firstName: schema.users.firstName, birthYear: schema.users.birthYear, visible: schema.profiles.visibleToSchools, accord: schema.profiles.parentConsentVisibilityAt })
    .from(schema.guardianships).innerJoin(schema.users, eq(schema.users.id, schema.guardianships.childId)).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.guardianships.childId))
    .where(and(eq(schema.guardianships.parentId, parent.id), eq(schema.guardianships.status, "actif")));
}

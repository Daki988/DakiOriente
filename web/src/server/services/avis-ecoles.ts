// Avis étudiants vérifiés sur les écoles (novembre 2026, docs/specs/2026-11-chantiers-fonctionnels.md, chantier 1).
// Seuls les étudiants dont l'inscription est prouvée donnent un avis :
//  - « navigoal » : candidature acceptée via Navigoal et inscription confirmée par l'école (échéancier : 1re échéance réglée) ;
//  - « justificatif » : attestation de scolarité de l'année déposée, vérifiée par l'équipe lors de la relecture.
// Un avis par personne, école et année universitaire, modifiable 30 jours (il repasse alors en relecture).
// Publication après relecture ; note affichée à partir de 3 avis ; une réponse publique de l'école, relue aussi ;
// signalement possible ; aucune école ne peut retirer ni masquer un avis.
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { audit } from "../lib/audit";
import { notify } from "./notifications";
import { assertMember } from "./establishments";
import { notifySchool } from "./applications";
import { nomPays } from "@/lib/pays-origine";
import { etabById } from "@/lib/data";

type User = typeof schema.users.$inferSelect;
export const SEUIL_NOTE = 3;
export const CRITERES = [
  ["enseignement", "Qualité de l'enseignement"], ["encadrement", "Encadrement et disponibilité"], ["accueil", "Accueil des étudiants étrangers"],
  ["campus", "Vie de campus et locaux"], ["insertion", "Stages et insertion"], ["prix", "Rapport qualité-prix"],
] as const;
const JOUR = 864e5;

/** Année universitaire en cours (bascule le 1er septembre), ex. « 2026-2027 ». */
export function anneeUniversitaire(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

const admins = () => db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")));
const prevenirEquipe = async (title: string, body?: string) => { for (const a of await admins()) await notify(a.id, { kind: "avis_ecole", title, body, link: "/admin/avis/?onglet=ecoles" }); };

/** Écoles que l'élève peut noter : celles qui l'ont accepté via Navigoal (vérification automatique si l'inscription est confirmée). */
export async function eligibilite(user: User) {
  if (!["eleve", "etudiant"].includes(user.role)) return { ecoles: [], mesAvis: [] };
  const apps = await db.select({ a: schema.applications, p: { title: schema.programs.title }, e: { inscription: schema.echeanciersScolarite.inscriptionConfirmee } })
    .from(schema.applications).innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
    .leftJoin(schema.echeanciersScolarite, eq(schema.echeanciersScolarite.applicationId, schema.applications.id))
    .where(and(eq(schema.applications.studentId, user.id), eq(schema.applications.status, "acceptee")));
  const mesAvis = await db.select().from(schema.avisEtablissements).where(eq(schema.avisEtablissements.auteurId, user.id)).orderBy(desc(schema.avisEtablissements.createdAt));
  return {
    annee: anneeUniversitaire(),
    ecoles: apps.map(({ a, p, e }) => ({ applicationId: a.id, etablissementId: a.establishmentId, nom: etabById[a.establishmentId]?.nom ?? a.establishmentId, formation: p.title, campus: a.campus, inscriptionConfirmee: !!e?.inscription })),
    mesAvis,
  };
}

const notes = z.object({ enseignement: z.number().int().min(1).max(5), encadrement: z.number().int().min(1).max(5), accueil: z.number().int().min(1).max(5), campus: z.number().int().min(1).max(5), insertion: z.number().int().min(1).max(5), prix: z.number().int().min(1).max(5) });
export const avisSchema = z.object({
  etablissementId: z.string().min(2),
  applicationId: z.string().optional().nullable(),
  formation: z.string().trim().max(200).optional().nullable(),
  campus: z.string().trim().max(80).optional().nullable(),
  notes,
  recommande: z.boolean(),
  pointsForts: z.string().trim().min(50, "Points forts : 50 caractères au moins.").max(1500),
  pointsFaibles: z.string().trim().min(50, "Points à améliorer : 50 caractères au moins.").max(1500),
  fraisDeclares: z.number().int().min(0).max(2_000_000).optional().nullable(),
  affichage: z.enum(["prenom", "anonyme"]).default("prenom"),
  justificatifId: z.string().optional().nullable(),
});

/** Dépose ou modifie (30 jours) l'avis de l'année sur une école. */
export async function deposer(user: User, raw: unknown) {
  if (!["eleve", "etudiant"].includes(user.role)) throw forbidden();
  const i = avisSchema.parse(raw);
  if (!etabById[i.etablissementId]) throw notFound("Établissement");
  const annee = anneeUniversitaire();
  let verification: "navigoal" | "justificatif" = "justificatif";
  let applicationId: string | null = null;
  if (i.applicationId) {
    const [a] = await db.select().from(schema.applications).where(and(eq(schema.applications.id, i.applicationId), eq(schema.applications.studentId, user.id), eq(schema.applications.establishmentId, i.etablissementId), eq(schema.applications.status, "acceptee")));
    if (!a) throw new AppError("Candidature introuvable ou non acceptée.");
    applicationId = a.id;
    const [e] = await db.select({ ok: schema.echeanciersScolarite.inscriptionConfirmee }).from(schema.echeanciersScolarite).where(eq(schema.echeanciersScolarite.applicationId, a.id));
    if (e?.ok) verification = "navigoal";
  }
  if (verification === "justificatif") {
    if (!i.justificatifId) throw new AppError("Déposez votre attestation ou certificat de scolarité de cette année : c'est ce qui garantit que les avis viennent de vrais étudiants.", 400, "justificatif_requis");
    const [d] = await db.select({ id: schema.documents.id }).from(schema.documents).where(and(eq(schema.documents.id, i.justificatifId), eq(schema.documents.ownerId, user.id)));
    if (!d) throw new AppError("Justificatif introuvable.");
  }
  const [avant] = await db.select().from(schema.avisEtablissements).where(and(eq(schema.avisEtablissements.auteurId, user.id), eq(schema.avisEtablissements.etablissementId, i.etablissementId), eq(schema.avisEtablissements.annee, annee)));
  if (avant && Date.now() - avant.createdAt.getTime() > 30 * JOUR) throw new AppError(`Votre avis ${annee} sur cette école n'est plus modifiable (30 jours). Vous pourrez en donner un nouveau l'an prochain.`);
  if (avant?.statut === "retire") throw new AppError("Cet avis a été retiré par l'équipe Navigoal.");
  const valeurs = {
    formation: i.formation ?? null, campus: i.campus ?? null, notes: i.notes, recommande: i.recommande, pointsForts: i.pointsForts, pointsFaibles: i.pointsFaibles,
    fraisDeclares: i.fraisDeclares ?? null, affichage: i.affichage, verification, applicationId, justificatifId: verification === "justificatif" ? i.justificatifId! : null,
    statut: "en_attente", motif: null,
  };
  const [a] = avant
    ? await db.update(schema.avisEtablissements).set(valeurs).where(eq(schema.avisEtablissements.id, avant.id)).returning()
    : await db.insert(schema.avisEtablissements).values({ auteurId: user.id, etablissementId: i.etablissementId, annee, ...valeurs }).returning();
  await prevenirEquipe(`Avis à relire : ${etabById[i.etablissementId]?.sigle ?? i.etablissementId}`, verification === "justificatif" ? "Justificatif de scolarité à vérifier." : "Inscription confirmée via Navigoal.");
  memo.delete(i.etablissementId);
  return a;
}

const nomAffiche = (u: { firstName: string; lastName: string; country: string | null }, affichage: string) =>
  affichage === "prenom" ? `${u.firstName} ${u.lastName.charAt(0)}.` : `Étudiant·e${u.country ? `, ${nomPays(u.country)}` : ""}`;
const moyenne = (n: schema.NotesAvis) => (n.enseignement + n.encadrement + n.accueil + n.campus + n.insertion + n.prix) / 6;

const memo = new Map<string, { at: number; data: Awaited<ReturnType<typeof calculer>> }>();
async function calculer(eid: string) {
  const lignes = await db.select({ a: schema.avisEtablissements, u: { firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country } })
    .from(schema.avisEtablissements).innerJoin(schema.users, eq(schema.users.id, schema.avisEtablissements.auteurId))
    .where(and(eq(schema.avisEtablissements.etablissementId, eid), eq(schema.avisEtablissements.statut, "publie"))).orderBy(desc(schema.avisEtablissements.publieLe));
  const n = lignes.length;
  const moy = (k: keyof schema.NotesAvis) => Math.round((lignes.reduce((s, x) => s + x.a.notes[k], 0) / n) * 10) / 10;
  return {
    nombre: n,
    stats: n >= SEUIL_NOTE ? {
      note: Math.round((lignes.reduce((s, x) => s + moyenne(x.a.notes), 0) / n) * 10) / 10,
      criteres: Object.fromEntries(CRITERES.map(([k]) => [k, moy(k)])) as Record<keyof schema.NotesAvis, number>,
      recommandent: Math.round((lignes.filter((x) => x.a.recommande).length / n) * 100),
    } : null,
    avis: lignes.map(({ a, u }) => ({
      id: a.id, nom: nomAffiche(u, a.affichage), formation: a.formation, campus: a.campus, annee: a.annee, verification: a.verification,
      note: Math.round(moyenne(a.notes) * 10) / 10, notes: a.notes, recommande: a.recommande, pointsForts: a.pointsForts, pointsFaibles: a.pointsFaibles,
      reponse: a.reponseStatut === "publie" ? { texte: a.reponse!, le: a.reponseLe } : null, le: a.publieLe,
    })),
  };
}
/** Avis publiés d'une école, avec la note (dès 3 avis). Gardés 10 min en mémoire. */
export async function publics(eid: string) {
  const m = memo.get(eid);
  if (m && Date.now() - m.at < 600e3) return m.data;
  const data = await calculer(eid);
  memo.set(eid, { at: Date.now(), data });
  return data;
}
/** Note et nombre d'avis de toutes les écoles (cartes, comparateur), dès 3 avis. */
export async function resumes() {
  const r = await db.execute(sql`select etablissement_id, count(*)::int as n,
      round(avg(((notes->>'enseignement')::int + (notes->>'encadrement')::int + (notes->>'accueil')::int + (notes->>'campus')::int + (notes->>'insertion')::int + (notes->>'prix')::int) / 6.0)::numeric, 1)::float as note
    from avis_etablissements where statut = 'publie' group by etablissement_id having count(*) >= ${SEUIL_NOTE}`);
  return Object.fromEntries((r.rows as { etablissement_id: string; n: number; note: number }[]).map((x) => [x.etablissement_id, { n: x.n, note: x.note }]));
}

// ---------------------------------------------------------------- École : réponse publique et signalement
export async function pourEcole(user: User, eid: string) {
  await assertMember(user, eid);
  return db.select().from(schema.avisEtablissements).where(and(eq(schema.avisEtablissements.etablissementId, eid), eq(schema.avisEtablissements.statut, "publie"))).orderBy(desc(schema.avisEtablissements.publieLe));
}

export async function repondre(user: User, avisId: string, raw: unknown) {
  const { texte } = z.object({ texte: z.string().trim().min(20, "Réponse : 20 caractères au moins.").max(1500) }).parse(raw);
  const [a] = await db.select().from(schema.avisEtablissements).where(eq(schema.avisEtablissements.id, avisId));
  if (!a || a.statut !== "publie") throw notFound("Avis");
  await assertMember(user, a.etablissementId);
  await db.update(schema.avisEtablissements).set({ reponse: texte, reponseStatut: "en_attente", reponseLe: new Date(), reponseParId: user.id }).where(eq(schema.avisEtablissements.id, avisId));
  await prevenirEquipe(`Réponse d'école à relire : ${etabById[a.etablissementId]?.sigle ?? a.etablissementId}`);
}

export async function signaler(user: User, avisId: string, raw: unknown) {
  const { motif } = z.object({ motif: z.string().trim().min(10, "Précisez le motif (10 caractères au moins).").max(1000) }).parse(raw);
  const [a] = await db.select({ id: schema.avisEtablissements.id, eid: schema.avisEtablissements.etablissementId }).from(schema.avisEtablissements).where(and(eq(schema.avisEtablissements.id, avisId), eq(schema.avisEtablissements.statut, "publie")));
  if (!a) throw notFound("Avis");
  const [deja] = await db.select({ id: schema.avisSignalements.id }).from(schema.avisSignalements).where(and(eq(schema.avisSignalements.avisId, avisId), eq(schema.avisSignalements.auteurId, user.id), eq(schema.avisSignalements.statut, "ouvert")));
  if (deja) throw new AppError("Vous avez déjà signalé cet avis : l'équipe l'examine.");
  await db.insert(schema.avisSignalements).values({ avisId, auteurId: user.id, motif });
  await prevenirEquipe(`Avis signalé : ${etabById[a.eid]?.sigle ?? a.eid}`, motif.slice(0, 160));
}

// ---------------------------------------------------------------- Équipe : relecture
export async function listeAdmin() {
  const A = schema.avisEtablissements;
  const lignes = await db.select({ a: A, u: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country, email: schema.users.email } })
    .from(A).innerJoin(schema.users, eq(schema.users.id, A.auteurId)).orderBy(desc(A.updatedAt)).limit(400);
  const signalements = await db.select().from(schema.avisSignalements).where(eq(schema.avisSignalements.statut, "ouvert"));
  return lignes.map(({ a, u }) => ({ ...a, ecole: etabById[a.etablissementId]?.sigle ?? a.etablissementId, auteur: { ...u, affiche: nomAffiche(u, a.affichage) }, note: Math.round(moyenne(a.notes) * 10) / 10, signalements: signalements.filter((s) => s.avisId === a.id) }));
}

export async function moderer(admin: User, id: string, raw: unknown) {
  const i = z.object({ statut: z.enum(["publie", "refuse", "retire"]), motif: z.string().trim().max(500).optional() }).parse(raw);
  if (i.statut !== "publie" && !i.motif) throw new AppError("Indiquez le motif : il est envoyé à l'auteur.");
  const [a] = await db.select().from(schema.avisEtablissements).where(eq(schema.avisEtablissements.id, id));
  if (!a) throw notFound("Avis");
  await db.update(schema.avisEtablissements).set({ statut: i.statut, motif: i.statut === "publie" ? null : i.motif!, moderePar: admin.id, modereLe: new Date(), publieLe: i.statut === "publie" ? (a.publieLe ?? new Date()) : a.publieLe }).where(eq(schema.avisEtablissements.id, id));
  await db.update(schema.avisSignalements).set({ statut: "traite", traitePar: admin.id }).where(and(eq(schema.avisSignalements.avisId, id), eq(schema.avisSignalements.statut, "ouvert")));
  await audit(admin.id, "moderation_avis_ecole", "avis_etablissement", id, { statut: i.statut });
  const ecole = etabById[a.etablissementId]?.sigle ?? a.etablissementId;
  await notify(a.auteurId, i.statut === "publie"
    ? { kind: "avis_ecole", title: `Votre avis sur ${ecole} est publié, merci !`, link: `/etablissements/${a.etablissementId}/#avis` }
    : { kind: "avis_ecole", title: `Votre avis sur ${ecole} n'est pas publié`, body: `Motif : ${i.motif}`, link: "/espace/avis/" });
  if (i.statut === "publie" && a.statut !== "publie") await notifySchool(a.etablissementId, "Nouvel avis d'étudiant publié sur votre fiche", "/etablissement/avis/");
  memo.delete(a.etablissementId);
}

export async function modererReponse(admin: User, id: string, raw: unknown) {
  const { statut } = z.object({ statut: z.enum(["publie", "refuse"]) }).parse(raw);
  const [a] = await db.select().from(schema.avisEtablissements).where(and(eq(schema.avisEtablissements.id, id), isNotNull(schema.avisEtablissements.reponse)));
  if (!a) throw notFound("Réponse");
  await db.update(schema.avisEtablissements).set({ reponseStatut: statut }).where(eq(schema.avisEtablissements.id, id));
  await audit(admin.id, "moderation_reponse_avis", "avis_etablissement", id, { statut });
  await notifySchool(a.etablissementId, statut === "publie" ? "Votre réponse à un avis est publiée" : "Votre réponse à un avis n'a pas été publiée (contenu à revoir)", "/etablissement/avis/");
  if (statut === "publie") await notify(a.auteurId, { kind: "avis_ecole", title: `${etabById[a.etablissementId]?.sigle ?? "L'école"} a répondu à votre avis`, link: `/etablissements/${a.etablissementId}/#avis` });
  memo.delete(a.etablissementId);
}

/** Signalement jugé sans fondement : clos, l'avis reste publié. */
export async function classerSignalements(admin: User, avisId: string) {
  await db.update(schema.avisSignalements).set({ statut: "traite", traitePar: admin.id }).where(and(eq(schema.avisSignalements.avisId, avisId), eq(schema.avisSignalements.statut, "ouvert")));
}

/** Invitation à donner son avis, en mars (fin du 1er semestre) et en juillet, aux étudiants acceptés ; une fois par période. */
export async function invitationsAvis(maintenant = new Date()) {
  const mois = maintenant.getMonth();
  if (mois !== 2 && mois !== 6) return { envoyees: 0 };
  const periode = `${maintenant.getFullYear()}-${mois === 2 ? "S1" : "S2"}`;
  const apps = await db.select({ id: schema.applications.id, student: schema.applications.studentId, eid: schema.applications.establishmentId })
    .from(schema.applications).where(eq(schema.applications.status, "acceptee"));
  const deja = new Set((await db.select({ k: sql<string>`${schema.avisEtablissements.auteurId} || ':' || ${schema.avisEtablissements.etablissementId}` }).from(schema.avisEtablissements)
    .where(and(eq(schema.avisEtablissements.annee, anneeUniversitaire(maintenant)), inArray(schema.avisEtablissements.statut, ["en_attente", "publie"])))).map((x) => x.k));
  let envoyees = 0;
  for (const a of apps) {
    if (deja.has(`${a.student}:${a.eid}`)) continue;
    const r = await db.insert(schema.counters).values({ key: `invitation:avis:${a.id}:${periode}`, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key });
    if (!r.length) continue;
    await notify(a.student, { kind: "avis_ecole", title: `Ton avis sur ${etabById[a.eid]?.sigle ?? "ton école"} aidera les futurs étudiants`, body: "Deux minutes suffisent : notes, points forts, points à améliorer. Les avis sont vérifiés et relus.", link: "/espace/avis/" });
    envoyees++;
  }
  return { envoyees };
}

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { nextNumber } from "../lib/counters";
import { AppError, forbidden, notFound } from "../lib/errors";
import { assertConsentIfMinor, isGuardianOf } from "./guardians";
import { assertMember } from "./establishments";
import { notify } from "./notifications";
import { DOC_LABEL } from "./documents";
import { CURRENCY } from "../payments/providers";
import { initiatePayment } from "./payments";

type User = typeof schema.users.$inferSelect;
type Status = (typeof schema.applicationStatusEnum.enumValues)[number];

export const STATUS_LABEL: Record<Status, string> = {
  brouillon: "Brouillon", soumise: "Soumise", paiement_confirme: "Paiement confirmé", en_verification: "Dossier en vérification", complet: "Dossier complet",
  en_traitement: "En cours de traitement", piece_demandee: "Pièce demandée", acceptee: "Acceptée", refusee: "Refusée", liste_attente: "Liste d'attente", desistee: "Désistement",
};

/** Transitions autorisées côté établissement. */
const SCHOOL_TRANSITIONS: Partial<Record<Status, Status[]>> = {
  soumise: ["en_verification", "piece_demandee", "refusee"],
  paiement_confirme: ["en_verification", "piece_demandee", "refusee"],
  en_verification: ["complet", "piece_demandee", "refusee"],
  piece_demandee: ["en_verification", "refusee"],
  complet: ["en_traitement", "acceptee", "refusee", "liste_attente"],
  en_traitement: ["acceptee", "refusee", "liste_attente"],
  liste_attente: ["acceptee", "refusee"],
};

async function addEvent(applicationId: string, status: Status, authorId: string | null, note?: string) {
  await db.insert(schema.applicationEvents).values({ applicationId, status, authorId, note: note ?? null });
}

export async function createDraft(student: User, programId: string) {
  if (!["eleve", "etudiant"].includes(student.role)) throw forbidden();
  const [p] = await db.select().from(schema.programs).where(and(eq(schema.programs.id, programId), eq(schema.programs.active, true), eq(schema.programs.homologated, true)));
  if (!p) throw notFound("Formation");
  const existing = await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.programId, programId), sql`${schema.applications.status} not in ('refusee','desistee')`)).limit(1);
  if (existing[0]) return existing[0];
  const number = await nextNumber("", 5);
  const [a] = await db.insert(schema.applications).values({ number, studentId: student.id, programId, establishmentId: p.establishmentId }).returning();
  await addEvent(a.id, "brouillon", student.id);
  return a;
}

export const draftSchema = z.object({ motivation: z.string().max(5000).optional(), answers: z.record(z.string(), z.string().max(2000)).optional(), documentIds: z.array(z.string()).max(30).optional(), campaignId: z.string().optional().nullable() });

async function ownApplication(student: User, id: string) {
  const [a] = await db.select().from(schema.applications).where(and(eq(schema.applications.id, id), eq(schema.applications.studentId, student.id)));
  if (!a) throw notFound("Candidature");
  return a;
}

export async function updateDraft(student: User, id: string, raw: z.input<typeof draftSchema>) {
  const a = await ownApplication(student, id);
  if (!["brouillon", "piece_demandee"].includes(a.status)) throw new AppError("Cette candidature n'est plus modifiable.");
  const i = draftSchema.parse(raw);
  if (i.documentIds?.length) {
    const owned = await db.select({ id: schema.documents.id }).from(schema.documents).where(and(eq(schema.documents.ownerId, student.id), inArray(schema.documents.id, i.documentIds)));
    if (owned.length !== new Set(i.documentIds).size) throw forbidden();
  }
  const [u] = await db.update(schema.applications).set(i).where(eq(schema.applications.id, id)).returning();
  return u;
}

/** Pièces manquantes par rapport aux exigences de la formation (et aux pièces demandées en complément). */
export async function missingDocuments(a: typeof schema.applications.$inferSelect) {
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.id, a.programId));
  const docs = a.documentIds.length ? await db.select({ type: schema.documents.type }).from(schema.documents).where(inArray(schema.documents.id, a.documentIds)) : [];
  const have = new Set(docs.map((d) => d.type));
  return [...new Set([...p.requiredDocuments, ...a.requestedDocuments])].filter((t) => !have.has(t as never));
}

/** Envoi : vérifie pièces et consentement, puis lance le paiement des frais de dossier s'il y en a. */
export async function submitApplication(student: User, id: string, payment?: { method: string; payerId?: string }) {
  const a = await ownApplication(student, id);
  if (a.status !== "brouillon" && a.status !== "piece_demandee") throw new AppError("Candidature déjà envoyée.");
  await assertConsentIfMinor(student);
  const missing = await missingDocuments(a);
  if (missing.length) throw new AppError(`Pièces manquantes : ${missing.map((m) => DOC_LABEL[m as keyof typeof DOC_LABEL] ?? m).join(", ")}.`, 400, "pieces_manquantes");
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.id, a.programId));
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, a.establishmentId));

  if (a.status === "piece_demandee") {
    await db.update(schema.applications).set({ status: "en_verification", requestedDocuments: [] }).where(eq(schema.applications.id, id));
    await addEvent(id, "en_verification", student.id, "Pièces complémentaires déposées");
    await notifySchool(a.establishmentId, `Pièces complémentaires reçues · candidature ${a.number}`, `/etablissement/candidatures/${a.id}`);
    return { application: { ...a, status: "en_verification" as Status }, redirectUrl: null };
  }

  await db.update(schema.applications).set({ status: "soumise", submittedAt: new Date() }).where(eq(schema.applications.id, id));
  await addEvent(id, "soumise", student.id);
  await audit(student.id, "candidature_envoyee", "application", id);
  await notify(student.id, { kind: "candidature_envoyee", title: `Candidature ${a.number} envoyée`, body: `${p.title} · ${e.nom}`, link: `/espace/candidatures/${id}` });
  await notifySchool(a.establishmentId, `Nouvelle candidature ${a.number} · ${p.title}`, `/etablissement/candidatures/${a.id}`);

  let redirectUrl: string | null = null;
  if (p.applicationFee > 0) {
    if (!payment?.method) throw new AppError("Choisissez un moyen de paiement pour les frais de dossier.");
    const cur = p.currency ?? CURRENCY[e.pays];
    const payer = payment.payerId && payment.payerId !== student.id ? (await db.select().from(schema.users).where(eq(schema.users.id, payment.payerId)))[0] : student;
    if (payer.id !== student.id && !(await isGuardianOf(payer.id, student.id))) throw forbidden();
    const r = await initiatePayment(payer, { kind: "frais_candidature", amount: p.applicationFee, currency: cur, method: payment.method, description: `Frais de dossier ${a.number} · ${e.sigle}`, applicationId: id, beneficiaryId: student.id });
    if (payer.id !== student.id) {
      // Paiement par le parent : il reçoit la demande ; l'élève est redirigé vers le suivi de sa candidature.
      await notify(payer.id, { kind: "paiement_demande", title: `${student.firstName} vous demande de régler ses frais de dossier`, body: `${p.title} · ${e.nom}`, link: r.redirectUrl, channels: ["app", "email", "sms"] });
      redirectUrl = `/espace/candidatures/${id}?paiement=parent`;
    } else redirectUrl = r.redirectUrl;
  }
  return { application: { ...a, status: "soumise" as Status }, redirectUrl };
}

export async function onApplicationFeePaid(applicationId: string) {
  const [a] = await db.update(schema.applications).set({ status: "paiement_confirme" }).where(and(eq(schema.applications.id, applicationId), eq(schema.applications.status, "soumise"))).returning();
  if (a) await addEvent(a.id, "paiement_confirme", null, "Frais de dossier réglés");
}

async function notifySchool(establishmentId: string, title: string, link: string) {
  const members = await db.select({ u: schema.establishmentMembers.userId }).from(schema.establishmentMembers).where(eq(schema.establishmentMembers.establishmentId, establishmentId));
  for (const m of members) await notify(m.u, { kind: "candidature_ecole", title, link });
}

export async function withdraw(student: User, id: string) {
  const a = await ownApplication(student, id);
  if (["refusee", "desistee"].includes(a.status)) throw new AppError("Cette candidature est déjà close.");
  await db.update(schema.applications).set({ status: "desistee" }).where(eq(schema.applications.id, id));
  await addEvent(id, "desistee", student.id);
}

/** Vue détaillée : étudiant propriétaire, parent lié, établissement destinataire, admin. */
export async function getApplication(viewer: User, id: string) {
  const [row] = await db.select({ a: schema.applications, p: schema.programs, e: schema.establishments, s: schema.users }).from(schema.applications)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.applications.establishmentId))
    .innerJoin(schema.users, eq(schema.users.id, schema.applications.studentId))
    .where(eq(schema.applications.id, id));
  if (!row) throw notFound("Candidature");
  const ok = viewer.role === "admin" || viewer.id === row.a.studentId || (viewer.role === "parent" && (await isGuardianOf(viewer.id, row.a.studentId)))
    || (viewer.role === "etablissement" && (await assertMember(viewer, row.a.establishmentId).then(() => true, () => false)));
  if (!ok) throw forbidden();
  if (viewer.role === "etablissement" && row.a.status === "brouillon") throw notFound("Candidature");
  const events = await db.select().from(schema.applicationEvents).where(eq(schema.applicationEvents.applicationId, id)).orderBy(schema.applicationEvents.createdAt);
  const docs = row.a.documentIds.length ? await db.select().from(schema.documents).where(inArray(schema.documents.id, row.a.documentIds)) : [];
  const { passwordHash: _h, totpSecret: _t, ...student } = row.s;
  return { application: row.a, program: row.p, establishment: row.e, student, events, documents: docs, missing: await missingDocuments(row.a) };
}

export async function listForStudent(studentId: string) {
  return db.select({ a: schema.applications, p: schema.programs, e: schema.establishments }).from(schema.applications)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.applications.establishmentId))
    .where(eq(schema.applications.studentId, studentId)).orderBy(desc(schema.applications.updatedAt));
}

export async function listForEstablishment(user: User, establishmentId: string, f: { status?: Status; programId?: string; q?: string; pays?: string } = {}) {
  await assertMember(user, establishmentId);
  return db.select({ a: schema.applications, p: schema.programs, s: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country, city: schema.users.city, email: schema.users.email, phone: schema.users.phone } })
    .from(schema.applications)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
    .innerJoin(schema.users, eq(schema.users.id, schema.applications.studentId))
    .where(and(eq(schema.applications.establishmentId, establishmentId), sql`${schema.applications.status} <> 'brouillon'`,
      f.status ? eq(schema.applications.status, f.status) : undefined, f.programId ? eq(schema.applications.programId, f.programId) : undefined,
      f.pays ? eq(schema.users.country, f.pays) : undefined,
      f.q ? or(ilike(schema.users.lastName, `%${f.q}%`), ilike(schema.users.firstName, `%${f.q}%`), ilike(schema.applications.number, `%${f.q}%`)) : undefined))
    .orderBy(desc(schema.applications.submittedAt));
}

export const decisionSchema = z.object({ status: z.enum(schema.applicationStatusEnum.enumValues), note: z.string().max(2000).optional(), requestedDocuments: z.array(z.enum(schema.documentTypeEnum.enumValues)).optional() });

export async function changeStatus(user: User, id: string, raw: z.input<typeof decisionSchema>) {
  const i = decisionSchema.parse(raw);
  const [a] = await db.select().from(schema.applications).where(eq(schema.applications.id, id));
  if (!a) throw notFound("Candidature");
  await assertMember(user, a.establishmentId);
  if (!(SCHOOL_TRANSITIONS[a.status] ?? []).includes(i.status) && user.role !== "admin") throw new AppError(`Passage de « ${STATUS_LABEL[a.status]} » à « ${STATUS_LABEL[i.status]} » non autorisé.`);
  if (i.status === "piece_demandee" && !i.requestedDocuments?.length) throw new AppError("Précisez la ou les pièces demandées.");
  const final = ["acceptee", "refusee"].includes(i.status);
  await db.update(schema.applications).set({ status: i.status, decisionNote: i.note ?? a.decisionNote, requestedDocuments: i.requestedDocuments ?? a.requestedDocuments, decidedAt: final ? new Date() : a.decidedAt }).where(eq(schema.applications.id, id));
  await addEvent(id, i.status, user.id, i.note);
  await audit(user.id, "statut_candidature", "application", id, { from: a.status, to: i.status });
  const msg = i.status === "acceptee" ? "Félicitations, vous êtes admis·e ! Découvrez les logements Navilease proches de votre école."
    : i.status === "piece_demandee" ? "L'établissement demande une pièce complémentaire." : i.note;
  const title = `Candidature ${a.number} : ${STATUS_LABEL[i.status]}`;
  await notify(a.studentId, { kind: "statut_candidature", title, body: msg ?? undefined, link: `/espace/candidatures/${id}`, channels: final || i.status === "piece_demandee" ? ["app", "email", "sms"] : ["app", "email"] });
  const parents = await db.select({ p: schema.guardianships.parentId }).from(schema.guardianships).where(and(eq(schema.guardianships.childId, a.studentId), eq(schema.guardianships.status, "actif")));
  for (const p of parents) if (p.p) await notify(p.p, { kind: "statut_candidature", title, link: `/espace/parent` });
}

export function toCsv(rows: Awaited<ReturnType<typeof listForEstablishment>>) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Numéro", "Nom", "Prénom", "Pays", "Ville", "E-mail", "Téléphone", "Formation", "Statut", "Envoyée le"];
  return [head.join(";"), ...rows.map((r) => [r.a.number, r.s.lastName, r.s.firstName, r.s.country, r.s.city, r.s.email, r.s.phone, r.p.title, STATUS_LABEL[r.a.status], r.a.submittedAt?.toISOString().slice(0, 10)].map(esc).join(";"))].join("\n");
}

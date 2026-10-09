import { and, asc, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError, forbidden, notFound } from "../lib/errors";

type User = typeof schema.users.$inferSelect;

/** Établissements gérés par un utilisateur (compte établissement). */
export async function myEstablishments(userId: string) {
  return db.select({ e: schema.establishments, role: schema.establishmentMembers.role }).from(schema.establishmentMembers)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.establishmentMembers.establishmentId))
    .where(eq(schema.establishmentMembers.userId, userId));
}

export async function assertMember(user: User, establishmentId: string) {
  if (user.role === "admin") return;
  if (user.role !== "etablissement" || user.status !== "actif") throw forbidden();
  const r = await db.select().from(schema.establishmentMembers).where(and(eq(schema.establishmentMembers.userId, user.id), eq(schema.establishmentMembers.establishmentId, establishmentId))).limit(1);
  if (!r.length) throw forbidden();
}

export async function getEstablishment(id: string) {
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, id));
  if (!e) throw notFound("Établissement");
  return e;
}

/** Labels Navigoal : seuls les établissements labellisés (diplômes homologués par l'État) sont publiés. */
export const LABELS = ["reconnu_etat", "diplomes_homologues", "professionnel"] as const;

export async function searchEstablishments(q: { pays?: string; ville?: string; label?: string; text?: string; limit?: number }) {
  return db.select().from(schema.establishments).where(and(
    isNotNull(schema.establishments.label),
    q.pays ? eq(schema.establishments.pays, q.pays) : undefined,
    q.ville ? eq(schema.establishments.ville, q.ville) : undefined,
    q.label ? eq(schema.establishments.label, q.label) : undefined,
    q.text ? or(ilike(schema.establishments.nom, `%${q.text}%`), ilike(schema.establishments.sigle, `%${q.text}%`), ilike(schema.establishments.ville, `%${q.text}%`)) : undefined,
    sql`${schema.establishments.status} <> 'suspendu'`,
  )).orderBy(desc(schema.establishments.featured), asc(schema.establishments.nom)).limit(q.limit ?? 200);
}

export const establishmentUpdateSchema = z.object({
  description: z.string().max(4000).optional(),
  siteWeb: z.string().url().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  ville: z.string().max(120).optional(),
  anneeCreation: z.coerce.number().int().min(1800).max(2100).optional(),
});

export async function updateEstablishment(user: User, id: string, raw: z.input<typeof establishmentUpdateSchema>) {
  await assertMember(user, id);
  const i = establishmentUpdateSchema.parse(raw);
  const [e] = await db.update(schema.establishments).set({ ...i, siteWeb: i.siteWeb || null, email: i.email || null, status: sql`case when ${schema.establishments.status} = 'importe' then 'revendique'::establishment_status else ${schema.establishments.status} end` }).where(eq(schema.establishments.id, id)).returning();
  await audit(user.id, "modification_fiche", "establishment", id, i);
  return e;
}

// ---------------------------------------------------------------- Formations publiées (programmes)
export const programSchema = z.object({
  formationId: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  faculty: z.string().trim().max(200).optional(),
  campus: z.string().trim().max(120).optional(),
  diploma: z.string().trim().max(160).optional(),
  level: z.enum(["niv-bac2", "niv-bac3", "niv-bac5", "niv-bac7", "niv-bac8"]).optional(),
  options: z.string().trim().max(500).optional(),
  // Référence de l'arrêté d'accréditation, vérifiée par l'équipe Navigoal avant publication
  homologationRef: z.string().trim().max(300).optional(),
  description: z.string().max(4000).optional(),
  durationYears: z.coerce.number().int().min(1).max(8).optional(),
  language: z.string().max(20).optional(),
  tuitionMin: z.coerce.number().int().min(0).optional(),
  tuitionMax: z.coerce.number().int().min(0).optional(),
  currency: z.enum(["XAF", "XOF", "MAD", "EUR"]).optional(),
  applicationFee: z.coerce.number().int().min(0).max(10_000_000).optional(),
  admission: z.object({ series: z.array(z.string()).optional(), noteMin: z.number().min(0).max(20).optional(), concours: z.boolean().optional(), entretien: z.boolean().optional(), prerequis: z.string().max(1000).optional() }).optional(),
  requiredDocuments: z.array(z.enum(schema.documentTypeEnum.enumValues)).optional(),
  seats: z.coerce.number().int().min(0).optional(),
  startDate: z.string().max(40).optional(),
  active: z.boolean().optional(),
});

/** Formations d'un établissement. Public : seulement les filières actives et homologuées par l'État. */
export async function listPrograms(establishmentId: string, onlyPublished = true) {
  return db.select().from(schema.programs).where(and(
    eq(schema.programs.establishmentId, establishmentId),
    onlyPublished ? and(eq(schema.programs.active, true), eq(schema.programs.homologated, true)) : undefined,
  )).orderBy(asc(schema.programs.faculty), asc(schema.programs.title));
}

export async function getProgram(id: string) {
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.id, id));
  if (!p) throw notFound("Formation");
  return p;
}

export async function upsertProgram(user: User, establishmentId: string, raw: z.input<typeof programSchema>, id?: string) {
  await assertMember(user, establishmentId);
  const i = programSchema.parse(raw);
  if (i.tuitionMin && i.tuitionMax && i.tuitionMin > i.tuitionMax) throw new AppError("Les frais minimum dépassent les frais maximum.");
  const { homologationRef, ...rest } = i;
  const values = { ...rest, faculty: rest.faculty ?? "", establishmentId, indicative: false, feesConfirmed: i.tuitionMin != null || i.tuitionMax != null };
  if (id) {
    const [before] = await db.select().from(schema.programs).where(and(eq(schema.programs.id, id), eq(schema.programs.establishmentId, establishmentId)));
    if (!before) throw notFound("Formation");
    // Changer l'intitulé d'une filière homologuée impose une nouvelle vérification avant publication.
    const renamed = before.homologated && (before.title !== values.title || before.faculty !== values.faculty);
    const pending = homologationRef ? { statut: "a_verifier", texte: homologationRef } : renamed ? { ...(before.homologation ?? { statut: "a_verifier" }), statut: "a_verifier" } : undefined;
    const [p] = await db.update(schema.programs).set({ ...values, ...(pending ? { homologated: false, homologation: pending } : {}) }).where(and(eq(schema.programs.id, id), eq(schema.programs.establishmentId, establishmentId))).returning();
    if (!p) throw notFound("Formation");
    await audit(user.id, "modification_formation", "program", id);
    return p;
  }
  const [p] = await db.insert(schema.programs).values({ ...values, homologated: false, homologation: { statut: "a_verifier", texte: homologationRef } }).returning();
  await audit(user.id, "creation_formation", "program", p.id);
  return p;
}

// ---------------------------------------------------------------- Campagnes
export const campaignSchema = z.object({
  kind: z.enum(schema.campaignKindEnum.enumValues),
  title: z.string().trim().min(3).max(200),
  description: z.string().max(4000).optional(),
  programIds: z.array(z.string()).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  seats: z.coerce.number().int().min(0).optional(),
  conditions: z.string().max(2000).optional(),
  requiredDocuments: z.array(z.enum(schema.documentTypeEnum.enumValues)).optional(),
  published: z.boolean().optional(),
});

export async function upsertCampaign(user: User, establishmentId: string, raw: z.input<typeof campaignSchema>, id?: string) {
  await assertMember(user, establishmentId);
  const i = campaignSchema.parse(raw);
  if (i.endsAt <= i.startsAt) throw new AppError("La date de fin doit suivre la date de début.");
  if (id) {
    const [c] = await db.update(schema.campaigns).set(i).where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.establishmentId, establishmentId))).returning();
    if (!c) throw notFound("Campagne");
    return c;
  }
  const [c] = await db.insert(schema.campaigns).values({ ...i, establishmentId }).returning();
  return c;
}

export async function listCampaigns(q: { establishmentId?: string; publishedOnly?: boolean; current?: boolean }) {
  const now = new Date();
  return db.select().from(schema.campaigns).where(and(
    q.establishmentId ? eq(schema.campaigns.establishmentId, q.establishmentId) : undefined,
    q.publishedOnly ? eq(schema.campaigns.published, true) : undefined,
    q.current ? sql`${schema.campaigns.endsAt} >= ${now}` : undefined,
  )).orderBy(asc(schema.campaigns.endsAt));
}

export async function myMembersOf(establishmentId: string) {
  return (await db.select({ u: schema.establishmentMembers.userId }).from(schema.establishmentMembers).where(eq(schema.establishmentMembers.establishmentId, establishmentId))).map((m) => m.u);
}

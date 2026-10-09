import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError, forbidden, notFound } from "../lib/errors";
import { hashPassword, passwordProblem } from "../auth/password";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
const admin = (u: User) => { if (u.role !== "admin") throw forbidden(); };

// ---------------------------------------------------------------- Utilisateurs
export async function listUsers(a: User, f: { role?: string; pays?: string; status?: string; q?: string; page?: number }) {
  admin(a);
  const where = and(
    f.role ? eq(schema.users.role, f.role as never) : undefined, f.pays ? eq(schema.users.country, f.pays) : undefined, f.status ? eq(schema.users.status, f.status as never) : undefined,
    f.q ? or(ilike(schema.users.lastName, `%${f.q}%`), ilike(schema.users.firstName, `%${f.q}%`), ilike(schema.users.email, `%${f.q}%`), ilike(schema.users.phone, `%${f.q}%`)) : undefined);
  const page = Math.max(1, f.page ?? 1);
  const rows = await db.select({ id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, email: schema.users.email, phone: schema.users.phone, role: schema.users.role, status: schema.users.status, country: schema.users.country, city: schema.users.city, createdAt: schema.users.createdAt, lastLoginAt: schema.users.lastLoginAt })
    .from(schema.users).where(where).orderBy(desc(schema.users.createdAt)).limit(50).offset((page - 1) * 50);
  const [{ n }] = await db.select({ n: count() }).from(schema.users).where(where);
  return { rows, total: n, page };
}

export async function setUserStatus(a: User, userId: string, status: "actif" | "suspendu") {
  admin(a);
  if (userId === a.id) throw new AppError("Vous ne pouvez pas modifier votre propre statut.");
  const [u] = await db.update(schema.users).set({ status }).where(eq(schema.users.id, userId)).returning();
  if (!u) throw notFound("Utilisateur");
  if (status === "suspendu") await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await audit(a.id, status === "suspendu" ? "suspension" : "activation", "user", userId);
  if (status === "actif" && u.role === "etablissement") {
    await db.update(schema.establishments).set({ status: "verifie" }).where(inArray(schema.establishments.id, db.select({ id: schema.establishmentMembers.establishmentId }).from(schema.establishmentMembers).where(eq(schema.establishmentMembers.userId, userId))));
    await notify(userId, { kind: "compte", title: "Votre espace établissement est activé", link: "/etablissement" });
  }
  return u;
}

/** Création de comptes internes (conseiller, administrateur). */
export async function createStaff(a: User, i: { role: "conseiller" | "admin"; firstName: string; lastName: string; email: string; password: string }) {
  admin(a);
  if (!["conseiller", "admin"].includes(i.role)) throw new AppError("Rôle interne invalide.");
  if (!i.firstName?.trim() || !i.lastName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email ?? "")) throw new AppError("Nom, prénom et e-mail valide obligatoires.");
  const pb = passwordProblem(i.password ?? "");
  if (pb) throw new AppError(pb);
  const [dup] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, i.email.toLowerCase()));
  if (dup) throw new AppError("Un compte existe déjà avec cet e-mail.", 409, "doublon");
  const [u] = await db.insert(schema.users).values({ role: i.role, firstName: i.firstName, lastName: i.lastName, email: i.email.toLowerCase(), passwordHash: await hashPassword(i.password), emailVerifiedAt: new Date() }).returning();
  await db.insert(schema.profiles).values({ userId: u.id });
  await audit(a.id, "creation_compte_interne", "user", u.id, { role: i.role });
  const { passwordHash: _h, totpSecret: _t, ...safe } = u;
  return safe;
}

// ---------------------------------------------------------------- Établissements
export async function listEstablishmentsAdmin(a: User, f: { status?: string; pays?: string; q?: string }) {
  admin(a);
  return db.select({ e: schema.establishments, members: sql<number>`(select count(*)::int from establishment_members m where m.establishment_id = ${schema.establishments.id})`, programs: sql<number>`(select count(*)::int from programs p where p.establishment_id = ${schema.establishments.id} and p.active)` })
    .from(schema.establishments).where(and(f.status ? eq(schema.establishments.status, f.status as never) : undefined, f.pays ? eq(schema.establishments.pays, f.pays) : undefined, f.q ? or(ilike(schema.establishments.nom, `%${f.q}%`), ilike(schema.establishments.sigle, `%${f.q}%`)) : undefined))
    .orderBy(schema.establishments.pays, schema.establishments.nom);
}

export async function updateEstablishmentAdmin(a: User, id: string, patch: { status?: "importe" | "revendique" | "verifie" | "suspendu"; featured?: boolean; plan?: string }) {
  admin(a);
  const [e] = await db.update(schema.establishments).set(patch).where(eq(schema.establishments.id, id)).returning();
  if (!e) throw notFound("Établissement");
  await audit(a.id, "maj_etablissement", "establishment", id, patch);
  return e;
}

// ---------------------------------------------------------------- Référentiels (versionnés)
const REF = { metiers: schema.refMetiers, formations: schema.refFormations, series: schema.refSeries, competences: schema.refCompetences, domaines: schema.refDomaines, pays: schema.refPays } as const;
export type RefName = keyof typeof REF;
export const refNames = Object.keys(REF) as RefName[];

export async function listRef(a: User, name: RefName, q?: string) {
  admin(a);
  const t = REF[name];
  const rows = await db.select().from(t);
  const items = rows.map((r) => ({ ...(r.data as object), id: r.id, published: "published" in r ? r.published : true }));
  return q ? items.filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase())) : items;
}

const itemSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9-]+$/, "Identifiant : lettres, chiffres et tirets.") }).passthrough();

export async function saveRefItem(a: User, name: RefName, raw: Record<string, unknown>) {
  admin(a);
  const item = itemSchema.parse(raw) as Record<string, unknown> & { id: string };
  const t = REF[name];
  const [before] = await db.select().from(t).where(eq(t.id, item.id));
  const { published, ...data } = item as { published?: boolean } & typeof item;
  const cols: Record<string, unknown> = { data };
  if (name === "metiers") Object.assign(cols, { nom: String(data.nom ?? ""), domaine: (data.domaine as string) ?? null, published: published ?? true });
  if (name === "formations") Object.assign(cols, { intitule: String(data.intitule ?? ""), domaine: (data.domaine as string) ?? null, published: published ?? true });
  if (name === "series") Object.assign(cols, { pays: String(data.pays ?? "") });
  if (name === "competences" || name === "domaines") Object.assign(cols, { libelle: String(data.libelle ?? "") });
  if (!Object.values(cols).every((v) => v !== "")) throw new AppError("Champs obligatoires manquants (nom, intitulé, libellé ou pays).");
  await db.insert(t).values({ id: item.id, ...cols } as never).onConflictDoUpdate({ target: t.id, set: cols as never });
  await db.insert(schema.refVersions).values({ referentiel: name, action: before ? "modification" : "creation", itemId: item.id, before: before?.data ?? null, after: data, authorId: a.id });
  return item;
}

export async function deleteRefItem(a: User, name: RefName, id: string) {
  admin(a);
  const t = REF[name];
  const [before] = await db.delete(t).where(eq(t.id, id)).returning();
  if (!before) throw notFound("Élément");
  await db.insert(schema.refVersions).values({ referentiel: name, action: "suppression", itemId: id, before: before.data, after: null, authorId: a.id });
}

/** Import JSON ({ items: [...] } ou tableau) ou CSV (séparateur « ; », colonnes = champs, listes séparées par « | »). */
export async function importRef(a: User, name: RefName, content: string, format: "json" | "csv") {
  admin(a);
  let items: Record<string, unknown>[];
  if (format === "json") {
    const j = JSON.parse(content);
    items = Array.isArray(j) ? j : j.items;
  } else {
    const [head, ...lines] = content.trim().split(/\r?\n/);
    const cols = head.split(";").map((c) => c.trim());
    items = lines.filter(Boolean).map((l) => Object.fromEntries(l.split(";").map((v, k) => [cols[k], v.includes("|") ? v.split("|").map((x) => x.trim()) : v.trim()])));
  }
  if (!Array.isArray(items)) throw new AppError("Format d'import invalide.");
  let n = 0;
  for (const it of items) { await saveRefItem(a, name, it); n++; }
  await db.insert(schema.refVersions).values({ referentiel: name, action: `import_${format}`, itemId: null, before: null, after: { count: n }, authorId: a.id });
  return n;
}

export async function exportRef(a: User, name: RefName, format: "json" | "csv") {
  const items = await listRef(a, name);
  if (format === "json") return JSON.stringify({ _meta: { referentiel: name, date: new Date().toISOString().slice(0, 10), plateforme: "Navigoal" }, items }, null, 2);
  const cols = [...new Set(items.flatMap((i) => Object.keys(i)))];
  const cell = (v: unknown) => (Array.isArray(v) ? v.join("|") : typeof v === "object" && v ? JSON.stringify(v) : String(v ?? "")).replace(/;/g, ",").replace(/\n/g, " ");
  return [cols.join(";"), ...items.map((i) => cols.map((c) => cell((i as Record<string, unknown>)[c])).join(";"))].join("\n");
}

export async function refHistory(a: User, name?: RefName) {
  admin(a);
  return db.select({ v: schema.refVersions, author: { firstName: schema.users.firstName, lastName: schema.users.lastName } }).from(schema.refVersions).leftJoin(schema.users, eq(schema.users.id, schema.refVersions.authorId))
    .where(name ? eq(schema.refVersions.referentiel, name) : undefined).orderBy(desc(schema.refVersions.createdAt)).limit(200);
}

// ---------------------------------------------------------------- Contenus
export const articleSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(5).max(200), category: z.string().min(2).max(40), excerpt: z.string().min(10).max(400), body: z.string().min(20), cover: z.string().optional().nullable(), pays: z.array(z.string()).default([]), published: z.boolean().default(false) });

export async function saveArticle(a: User, raw: z.input<typeof articleSchema>, id?: string) {
  admin(a);
  const i = articleSchema.parse(raw);
  const values = { ...i, authorId: a.id, publishedAt: i.published ? new Date() : null };
  if (id) {
    const [prev] = await db.select().from(schema.articles).where(eq(schema.articles.id, id));
    if (!prev) throw notFound("Article");
    const [r] = await db.update(schema.articles).set({ ...values, publishedAt: i.published ? (prev.publishedAt ?? new Date()) : null }).where(eq(schema.articles.id, id)).returning();
    return r;
  }
  const [r] = await db.insert(schema.articles).values(values).returning();
  return r;
}
export const listArticles = (publishedOnly = true) => db.select().from(schema.articles).where(publishedOnly ? eq(schema.articles.published, true) : undefined).orderBy(desc(sql`coalesce(${schema.articles.publishedAt}, ${schema.articles.createdAt})`));
export async function getArticle(slug: string) {
  const [r] = await db.select().from(schema.articles).where(and(eq(schema.articles.slug, slug), eq(schema.articles.published, true)));
  if (!r) throw notFound("Article");
  return r;
}

export async function saveTestimonial(a: User, i: { name: string; role: string; quote: string; pays?: string; published?: boolean }, id?: string) {
  admin(a);
  if (id) return (await db.update(schema.testimonials).set(i).where(eq(schema.testimonials.id, id)).returning())[0];
  return (await db.insert(schema.testimonials).values(i).returning())[0];
}
export async function savePartner(a: User, i: { name: string; kind: string; url?: string; logo?: string; featured?: boolean }, id?: string) {
  admin(a);
  if (id) return (await db.update(schema.partners).set(i).where(eq(schema.partners.id, id)).returning())[0];
  return (await db.insert(schema.partners).values(i).returning())[0];
}

// ---------------------------------------------------------------- Paiements, Navilease, journal
export async function listPaymentsAdmin(a: User, f: { status?: string; escrow?: string; kind?: string }) {
  admin(a);
  return db.select({ p: schema.payments, payer: { firstName: schema.users.firstName, lastName: schema.users.lastName } }).from(schema.payments).innerJoin(schema.users, eq(schema.users.id, schema.payments.payerId))
    .where(and(f.status ? eq(schema.payments.status, f.status as never) : undefined, f.escrow ? eq(schema.payments.escrow, f.escrow as never) : undefined, f.kind ? eq(schema.payments.kind, f.kind as never) : undefined))
    .orderBy(desc(schema.payments.createdAt)).limit(300);
}

export async function moderationQueue(a: User) {
  admin(a);
  const [housings, kyc, disputes] = await Promise.all([
    db.select({ h: schema.housings, l: { firstName: schema.users.firstName, lastName: schema.users.lastName } }).from(schema.housings).innerJoin(schema.users, eq(schema.users.id, schema.housings.landlordId)).where(eq(schema.housings.status, "en_moderation")).orderBy(schema.housings.updatedAt),
    db.select({ l: schema.landlords, u: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, email: schema.users.email, phone: schema.users.phone } }).from(schema.landlords).innerJoin(schema.users, eq(schema.users.id, schema.landlords.userId)).where(eq(schema.landlords.kycStatus, "en_revue")),
    db.select({ d: schema.disputes, b: { number: schema.bookings.number, currency: schema.bookings.currency } }).from(schema.disputes).innerJoin(schema.bookings, eq(schema.bookings.id, schema.disputes.bookingId)).where(inArray(schema.disputes.status, ["ouvert", "en_mediation"])).orderBy(schema.disputes.createdAt),
  ]);
  return { housings, kyc, disputes };
}

export async function auditLog(a: User, limit = 200) {
  admin(a);
  return db.select({ l: schema.auditLogs, actor: { firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role } }).from(schema.auditLogs).leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorId)).orderBy(desc(schema.auditLogs.createdAt)).limit(limit);
}

// ---------------------------------------------------------------- Statistiques (§37)
export async function stats(a: User) {
  admin(a);
  const since = new Date(Date.now() - 30 * 864e5);
  const q = async <T,>(s: ReturnType<typeof sql>) => (await db.execute(s)).rows as T[];
  const [usersByRole, usersByCountry, [activity], [orientation], appsByStatus, topFormations, [navi], paymentsByCur, weekly] = await Promise.all([
    q<{ role: string; n: number }>(sql`select role, count(*)::int n from users group by role`),
    q<{ country: string | null; n: number }>(sql`select country, count(*)::int n from users where role in ('eleve','etudiant') group by country`),
    q<{ total: number; nouveaux: number; actifs: number }>(sql`select count(*)::int total, count(*) filter (where created_at >= ${since})::int nouveaux, count(*) filter (where last_login_at >= ${since})::int actifs from users`),
    q<{ tests: number; profils: Record<string, number> | null }>(sql`select count(*)::int tests, (select jsonb_object_agg(k, n) from (select top->>0 k, count(*)::int n from orientation_results group by 1) x) profils from orientation_results`),
    q<{ status: string; n: number }>(sql`select status, count(*)::int n from applications group by status`),
    q<{ title: string; n: number }>(sql`select p.title, count(*)::int n from applications a join programs p on p.id = a.program_id where a.status <> 'brouillon' group by p.title order by n desc limit 8`),
    q<{ actives: number; verifiees: number; reservations: number; occupees: number; litiges: number; loyer_moyen: number | null }>(sql`select
      (select count(*)::int from housings where status='publie') actives,
      (select count(*)::int from housings where status='publie' and verification <> 'non_verifie') verifiees,
      (select count(*)::int from bookings) reservations,
      (select count(distinct housing_id)::int from bookings where status in ('en_cours','preavis','fonds_verses','entree')) occupees,
      (select count(*)::int from disputes where status in ('ouvert','en_mediation')) litiges,
      (select avg(rent)::int from housings where status='publie') loyer_moyen`),
    q<{ currency: string; total: number; sequestre: number }>(sql`select currency, sum(amount) filter (where status='reussi')::int total, sum(amount) filter (where escrow='bloque')::int sequestre from payments group by currency`),
    q<{ semaine: string; n: number }>(sql`select to_char(date_trunc('week', submitted_at), 'YYYY-MM-DD') semaine, count(*)::int n from applications where submitted_at >= now() - interval '12 weeks' group by 1 order by 1`),
  ]);
  const funnel = await q<{ inscrits: number; testes: number; candidats: number; admis: number; loges: number }>(sql`select
    (select count(*)::int from users where role in ('eleve','etudiant')) inscrits,
    (select count(distinct user_id)::int from orientation_results) testes,
    (select count(distinct student_id)::int from applications where status <> 'brouillon') candidats,
    (select count(distinct student_id)::int from applications where status = 'acceptee') admis,
    (select count(distinct tenant_id)::int from bookings where status in ('paiement_sequestre','contrat_signe','entree','fonds_verses','en_cours','preavis','sortie','caution_restituee')) loges`);
  return { usersByRole, usersByCountry, activity, orientation, appsByStatus, topFormations, navilease: navi, paymentsByCur, weekly, funnel: funnel[0] };
}


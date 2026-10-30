// Relais Navigoal : l'administrateur voit toutes les candidatures et tous les échanges, répond au nom de l'équipe
// (« pour le compte de » l'école ou du bailleur) et traite les dossiers des comptes en mode accompagné.
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError, forbidden, notFound } from "../lib/errors";
import { findOrCreateConversation, maskContacts } from "./messaging";
import { myMembersOf } from "./establishments";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
type Status = (typeof schema.applicationStatusEnum.enumValues)[number];
const assertAdmin = (u: User) => { if (u.role !== "admin") throw forbidden(); };

/** Jours d'attente côté candidat : depuis la dernière action de l'école (ou de Navigoal), son dernier message sans réponse, ou l'envoi. */
const attente = sql<number | null>`case when ${schema.applications.status} in ('soumise','paiement_confirme','en_verification','complet','en_traitement')
  then floor(extract(epoch from (now() - greatest(
    coalesce(${schema.applications.submittedAt}, ${schema.applications.createdAt}),
    coalesce((select max(ev.created_at) from application_events ev join users au on au.id = ev.author_id where ev.application_id = ${schema.applications.id} and au.role in ('etablissement','admin')), 'epoch'::timestamptz)
  ))) / 86400)::int else null end`;

export async function listAllApplications(admin: User, f: { q?: string; etablissement?: string; status?: string; pays?: string; gere?: string; attente?: boolean; page?: number }) {
  assertAdmin(admin);
  const status = schema.applicationStatusEnum.enumValues.includes(f.status as Status) ? (f.status as Status) : undefined;
  const where = and(
    sql`${schema.applications.status} <> 'brouillon'`,
    f.etablissement ? eq(schema.applications.establishmentId, f.etablissement) : undefined,
    status ? eq(schema.applications.status, status) : undefined,
    f.pays ? eq(schema.users.country, f.pays) : undefined,
    f.gere === "navigoal" ? eq(schema.establishments.assisted, true) : f.gere === "ecole" ? eq(schema.establishments.assisted, false) : undefined,
    f.attente ? sql`${attente} >= 3` : undefined,
    f.q ? or(ilike(schema.applications.number, `%${f.q}%`), ilike(schema.users.lastName, `%${f.q}%`), ilike(schema.users.firstName, `%${f.q}%`), ilike(schema.users.email, `%${f.q}%`)) : undefined,
  );
  const page = Math.max(1, f.page ?? 1);
  const rows = await db.select({
    id: schema.applications.id, number: schema.applications.number, status: schema.applications.status, submittedAt: schema.applications.submittedAt, attente,
    student: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country },
    program: schema.programs.title, establishment: { id: schema.establishments.id, sigle: schema.establishments.sigle, nom: schema.establishments.nom, logo: schema.establishments.logo, assisted: schema.establishments.assisted },
  }).from(schema.applications)
    .innerJoin(schema.users, eq(schema.users.id, schema.applications.studentId))
    .innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.applications.establishmentId))
    .where(where).orderBy(sql`${attente} desc nulls last`, desc(schema.applications.submittedAt)).limit(50).offset((page - 1) * 50);
  const [stats] = await db.select({
    total: sql<number>`count(*)::int`,
    enRetard: sql<number>`count(*) filter (where ${attente} >= 3)::int`,
    accompagnees: sql<number>`count(*) filter (where ${schema.establishments.assisted})::int`,
    pieces: sql<number>`count(*) filter (where ${schema.applications.status} = 'piece_demandee')::int`,
  }).from(schema.applications).innerJoin(schema.establishments, eq(schema.establishments.id, schema.applications.establishmentId)).where(sql`${schema.applications.status} <> 'brouillon'`);
  const [ecoles] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.establishments).where(eq(schema.establishments.assisted, true));
  return { items: rows, stats: { ...stats, ecolesAccompagnees: ecoles.n }, page };
}

// ---------------------------------------------------------------- Conversations
const ROLES_PRO = ["etablissement", "bailleur", "admin", "conseiller"];

export async function listAllConversations(admin: User, f: { type?: string; q?: string; attente?: boolean }) {
  assertAdmin(admin);
  const kind = f.type === "application" ? ["application", "invitation"] : f.type === "navilease" ? ["booking", "housing"] : f.type === "conseil" ? ["conseil", "support"] : null;
  const convs = await db.select().from(schema.conversations)
    .where(and(kind ? inArray(schema.conversations.contextKind, kind) : undefined, f.q ? ilike(schema.conversations.subject, `%${f.q}%`) : undefined))
    .orderBy(desc(schema.conversations.lastMessageAt)).limit(200);
  if (!convs.length) return { items: [], counts: await compter() };
  const ids = convs.map((c) => c.id);
  const parts = await db.select({ cid: schema.conversationParticipants.conversationId, id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role })
    .from(schema.conversationParticipants).innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(inArray(schema.conversationParticipants.conversationId, ids));
  const last = await db.execute<{ conversation_id: string; body: string; created_at: Date; role: string; on_behalf_of: string | null }>(sql`select distinct on (m.conversation_id) m.conversation_id, m.body, m.created_at, u.role, m.on_behalf_of
    from messages m join users u on u.id = m.author_id where m.conversation_id in ${ids} and not m.internal order by m.conversation_id, m.created_at desc`);
  const items = convs.map((c) => {
    const l = last.rows.find((x) => x.conversation_id === c.id) ?? null;
    // En attente : le dernier message vient du candidat, du parent ou du locataire.
    const enAttente = !!l && !ROLES_PRO.includes(l.role);
    const jours = enAttente ? Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000) : null;
    return { ...c, participants: parts.filter((p) => p.cid === c.id), last: l, enAttente, jours };
  }).filter((c) => !f.attente || c.enAttente);
  return { items, counts: await compter() };
}

async function compter() {
  const r = await db.execute<{ k: string; n: number }>(sql`select case when context_kind in ('booking','housing') then 'navilease' when context_kind in ('application','invitation') then 'application' else 'conseil' end k, count(*)::int n from conversations group by 1`);
  return Object.fromEntries(r.rows.map((x) => [x.k, x.n])) as Record<string, number>;
}

/** Contexte d'un fil : candidature (école, dossier) ou réservation (bailleur). */
async function contexte(c: typeof schema.conversations.$inferSelect) {
  if ((c.contextKind === "application") && c.contextId) {
    const [r] = await db.select({ a: schema.applications, e: schema.establishments, p: schema.programs.title }).from(schema.applications)
      .innerJoin(schema.establishments, eq(schema.establishments.id, schema.applications.establishmentId)).innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
      .where(eq(schema.applications.id, c.contextId));
    if (r) {
      const docs = r.a.documentIds.length ? await db.select({ id: schema.documents.id, type: schema.documents.type, label: schema.documents.label, status: schema.documents.status }).from(schema.documents).where(inArray(schema.documents.id, r.a.documentIds)) : [];
      return { type: "application" as const, pourLeCompteDe: r.e.nom, establishment: { id: r.e.id, nom: r.e.nom, sigle: r.e.sigle, logo: r.e.logo, assisted: r.e.assisted }, application: { id: r.a.id, number: r.a.number, status: r.a.status, programme: r.p, submittedAt: r.a.submittedAt, requestedDocuments: r.a.requestedDocuments }, documents: docs };
    }
  }
  if ((c.contextKind === "booking") && c.contextId) {
    const [b] = await db.select({ b: schema.bookings, h: schema.housings.title, l: schema.users }).from(schema.bookings)
      .innerJoin(schema.housings, eq(schema.housings.id, schema.bookings.housingId)).innerJoin(schema.users, eq(schema.users.id, schema.bookings.landlordId)).where(eq(schema.bookings.id, c.contextId));
    if (b) return { type: "booking" as const, pourLeCompteDe: `${b.l.firstName} ${b.l.lastName} (bailleur)`, booking: { id: b.b.id, number: b.b.number, status: b.b.status, logement: b.h } };
  }
  if (c.contextKind === "invitation" && c.contextId) {
    const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, (await db.select({ e: schema.invitations.establishmentId }).from(schema.invitations).where(eq(schema.invitations.id, c.contextId)))[0]?.e ?? ""));
    if (e) return { type: "invitation" as const, pourLeCompteDe: e.nom, establishment: { id: e.id, nom: e.nom, sigle: e.sigle, logo: e.logo, assisted: e.assisted } };
  }
  return { type: "autre" as const, pourLeCompteDe: null };
}

export async function getConversationAdmin(admin: User, id: string) {
  assertAdmin(admin);
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, id));
  if (!c) throw notFound("Conversation");
  const messages = await db.select({ m: schema.messages, a: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role } })
    .from(schema.messages).innerJoin(schema.users, eq(schema.users.id, schema.messages.authorId)).where(eq(schema.messages.conversationId, id)).orderBy(schema.messages.createdAt);
  const participants = await db.select({ id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role })
    .from(schema.conversationParticipants).innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(eq(schema.conversationParticipants.conversationId, id));
  return { conversation: c, messages, participants, contexte: await contexte(c) };
}

/** Message de l'équipe Navigoal dans un fil (réponse au candidat ou note interne visible des seuls professionnels). */
export async function adminPost(admin: User, conversationId: string, body: string, internal = false) {
  assertAdmin(admin);
  const text = body.trim();
  if (!text) throw new AppError("Message vide.");
  if (text.length > 5000) throw new AppError("Message trop long.");
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId));
  if (!c) throw notFound("Conversation");
  const ctx = await contexte(c);
  // Navilease avant paiement : coordonnées masquées pour tout le monde, l'équipe comprise (pas de contournement du séquestre).
  const masque = c.contextKind === "housing" || (ctx.type === "booking" && ["demande", "acceptee", "attente_garant", "refusee", "annulee"].includes(ctx.booking.status));
  const finalBody = masque && !internal ? maskContacts(text) : text;
  const [m] = await db.insert(schema.messages).values({ conversationId, authorId: admin.id, body: finalBody, masked: finalBody !== text, internal, onBehalfOf: ctx.pourLeCompteDe }).returning();
  if (!internal) await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conversationId));
  const parts = await db.select({ id: schema.users.id, role: schema.users.role }).from(schema.conversationParticipants).innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(eq(schema.conversationParticipants.conversationId, conversationId));
  for (const p of parts) {
    const pro = ROLES_PRO.includes(p.role);
    if (internal && !pro) continue;
    await notify(p.id, pro
      ? { kind: "relais", title: `${internal ? "Note interne" : "Réponse"} de l'équipe Navigoal · ${c.subject}`, body: text.slice(0, 300), link: `/messages/${conversationId}`, channels: ["app", "email"] }
      : { kind: "message", title: `Réponse de l'équipe Navigoal · ${c.subject}`, body: finalBody.slice(0, 300), link: `/messages/${conversationId}`, channels: ["app", "email"] });
  }
  await audit(admin.id, internal ? "relais_note_interne" : "relais_message", "conversation", conversationId, { pourLeCompteDe: ctx.pourLeCompteDe });
  return m;
}

/** Ouvre (ou retrouve) le fil d'une candidature pour y répondre au candidat. */
export async function openApplicationThread(admin: User, applicationId: string) {
  assertAdmin(admin);
  const [r] = await db.select({ a: schema.applications, p: schema.programs.title }).from(schema.applications).innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId)).where(eq(schema.applications.id, applicationId));
  if (!r) throw notFound("Candidature");
  const members = await myMembersOf(r.a.establishmentId);
  return findOrCreateConversation(`Candidature ${r.a.number} · ${r.p}`, [r.a.studentId, ...members], { kind: "application", id: r.a.id });
}

// ---------------------------------------------------------------- Mode accompagné
export async function setEstablishmentAssisted(admin: User, id: string, on: boolean) {
  assertAdmin(admin);
  const [e] = await db.update(schema.establishments).set({ assisted: on }).where(eq(schema.establishments.id, id)).returning();
  if (!e) throw notFound("Établissement");
  for (const m of await myMembersOf(id)) await notify(m, { kind: "accompagnement", title: on ? "Mode accompagné activé : l'équipe Navigoal vous aide à traiter vos candidatures" : "Mode accompagné désactivé : vous gérez seul vos candidatures", body: on ? "Nous pourrons répondre aux candidats et faire avancer les dossiers en votre nom. Vous êtes prévenu de chaque action et gardez la main." : undefined, link: "/etablissement/candidatures" });
  await audit(admin.id, on ? "accompagnement_active" : "accompagnement_desactive", "establishment", id);
  return e;
}

export async function setLandlordAssisted(admin: User, userId: string, on: boolean) {
  assertAdmin(admin);
  const [l] = await db.update(schema.landlords).set({ assisted: on }).where(eq(schema.landlords.userId, userId)).returning();
  if (!l) throw notFound("Bailleur");
  await notify(userId, { kind: "accompagnement", title: on ? "Mode accompagné activé : l'équipe Navigoal répond aux demandes de logement avec vous" : "Mode accompagné désactivé", link: "/bailleur" });
  await audit(admin.id, on ? "accompagnement_active" : "accompagnement_desactive", "landlord", userId);
  return l;
}

export async function listAssisted(admin: User) {
  assertAdmin(admin);
  const ecoles = await db.select({ id: schema.establishments.id, nom: schema.establishments.nom, sigle: schema.establishments.sigle, logo: schema.establishments.logo, ville: schema.establishments.ville, assisted: schema.establishments.assisted,
    attente: sql<number>`(select count(*) from applications a where a.establishment_id = ${schema.establishments.id} and a.status in ('soumise','paiement_confirme','en_verification','complet','en_traitement'))::int`,
    membres: sql<number>`(select count(*) from establishment_members m join users u on u.id = m.user_id where m.establishment_id = ${schema.establishments.id} and u.status = 'actif')::int` })
    .from(schema.establishments).orderBy(desc(schema.establishments.assisted), schema.establishments.sigle);
  const bailleurs = await db.select({ id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, city: schema.users.city, assisted: schema.landlords.assisted, company: schema.landlords.company,
    annonces: sql<number>`(select count(*) from housings h where h.landlord_id = ${schema.users.id} and h.status = 'publie')::int`,
    demandes: sql<number>`(select count(*) from bookings b where b.landlord_id = ${schema.users.id} and b.status = 'demande')::int` })
    .from(schema.landlords).innerJoin(schema.users, eq(schema.users.id, schema.landlords.userId)).where(ne(schema.users.status, "suspendu")).orderBy(desc(schema.landlords.assisted));
  return { ecoles, bailleurs };
}

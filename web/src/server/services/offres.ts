// Offres payantes des établissements : catalogue modifiable, abonnements (activation, prolongation, arrêt),
// effets réels sur la plateforme (Premium, mise en avant, « À la une de l'accueil »), rappels d'échéance et
// statistiques de visibilité des écoles mises en avant.
import { and, asc, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { forbidden, notFound } from "../lib/errors";
import { assertMember, myMembersOf } from "./establishments";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
type Sub = typeof schema.subscriptions.$inferSelect;
const assertAdmin = (u: User) => { if (u.role !== "admin") throw forbidden(); };
const fr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
export const MOYENS = { virement: "Virement bancaire", especes: "Espèces", cheque: "Chèque", mobile_money: "Mobile money", carte: "Carte bancaire", offert: "Offert" } as const;
/** Effets qui mettent l'école en avant sur le site public. */
const EFFETS_AVANT = ["premium", "mise_en_avant", "une_accueil"];

// ---------------------------------------------------------------- Catalogue
export const listServices = () => db.select().from(schema.offerServices).orderBy(asc(schema.offerServices.position));

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(600).optional(),
  prices: z.array(z.object({ months: z.coerce.number().int().min(1).max(36), amount: z.coerce.number().int().min(0).max(10_000_000).nullable() })).min(1).max(6).optional(),
  active: z.boolean().optional(),
});

export async function updateService(admin: User, code: string, raw: z.input<typeof serviceSchema>) {
  assertAdmin(admin);
  const i = serviceSchema.parse(raw);
  const [s] = await db.update(schema.offerServices).set({ ...i, ...(i.prices ? { prices: [...i.prices].sort((a, b) => a.months - b.months) } : {}) }).where(eq(schema.offerServices.code, code)).returning();
  if (!s) throw notFound("Service");
  await audit(admin.id, "tarif_modifie", "offer_service", code, i);
  return s;
}

// ---------------------------------------------------------------- Effets sur l'établissement
/** Recalcule ce que les abonnements en cours activent (plan Premium, mise en avant, une de l'accueil). */
export async function synchroniser(establishmentId: string) {
  const now = new Date();
  const subs = await db.select({ s: schema.subscriptions, effect: schema.offerServices.effect }).from(schema.subscriptions)
    .innerJoin(schema.offerServices, eq(schema.offerServices.code, schema.subscriptions.serviceCode))
    .where(and(eq(schema.subscriptions.establishmentId, establishmentId), isNull(schema.subscriptions.cancelledAt)));
  const fin = (effets: string[]) => subs.filter((x) => effets.includes(x.effect) && x.s.startsAt <= now && x.s.endsAt > now).reduce<Date | null>((m, x) => (!m || x.s.endsAt > m ? x.s.endsAt : m), null);
  // Une prolongation déjà payée (démarrant à la fin de la période en cours) prolonge l'effet sans interruption.
  const chaine = (effets: string[]) => {
    let f = fin(effets);
    if (!f) return null;
    for (let k = 0; k < 10; k++) {
      const suite = subs.filter((x) => effets.includes(x.effect) && x.s.startsAt <= f! && x.s.endsAt > f!).reduce<Date | null>((m, x) => (!m || x.s.endsAt > m ? x.s.endsAt : m), null);
      if (!suite) break; f = suite;
    }
    return f;
  };
  const premiumUntil = chaine(["premium"]);
  const featuredUntil = chaine(EFFETS_AVANT);
  const homeUntil = chaine(["une_accueil"]);
  await db.update(schema.establishments).set({ plan: premiumUntil ? "premium" : "gratuit", premiumUntil, featuredUntil, homeUntil, featured: !!featuredUntil }).where(eq(schema.establishments.id, establishmentId));
  cache = null;
  return { premiumUntil, featuredUntil, homeUntil };
}

// ---------------------------------------------------------------- Abonnements
export const activationSchema = z.object({
  etablissement: z.string().min(1).max(100),
  service: z.string().min(1).max(40),
  months: z.coerce.number().int().min(1).max(36),
  amount: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  method: z.enum(Object.keys(MOYENS) as [keyof typeof MOYENS]).nullable().optional(),
  reference: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  startsAt: z.coerce.date().optional(),
});

/** Active ou prolonge un service : une prolongation démarre à la fin de l'abonnement en cours du même service. */
export async function activate(admin: User, raw: z.input<typeof activationSchema>) {
  assertAdmin(admin);
  const i = activationSchema.parse(raw);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, i.etablissement));
  if (!e) throw notFound("Établissement");
  const [svc] = await db.select().from(schema.offerServices).where(eq(schema.offerServices.code, i.service));
  if (!svc) throw notFound("Service");
  const [encours] = await db.select().from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.establishmentId, e.id), eq(schema.subscriptions.serviceCode, svc.code), isNull(schema.subscriptions.cancelledAt), gt(schema.subscriptions.endsAt, new Date())))
    .orderBy(desc(schema.subscriptions.endsAt)).limit(1);
  const debut = i.startsAt ?? (encours ? encours.endsAt : new Date());
  const fin = new Date(debut); fin.setMonth(fin.getMonth() + i.months);
  const tarif = svc.prices.find((p) => p.months === i.months)?.amount ?? null;
  const [s] = await db.insert(schema.subscriptions).values({
    establishmentId: e.id, serviceCode: svc.code, months: i.months, startsAt: debut, endsAt: fin,
    amount: i.amount !== undefined ? i.amount : tarif, paymentMethod: i.method ?? null, paymentRef: i.reference || null, note: i.note || null, createdBy: admin.id,
  }).returning();
  await synchroniser(e.id);
  for (const m of await myMembersOf(e.id)) await notify(m, { kind: "offre", title: `${svc.name} ${encours ? "prolongé" : "activé"} jusqu'au ${fr(fin)}`, body: svc.description, link: "/etablissement/offre", channels: ["app", "email"] });
  await audit(admin.id, encours ? "abonnement_prolonge" : "abonnement_active", "establishment", e.id, { service: svc.code, mois: i.months, montant: s.amount, reference: s.paymentRef });
  return s;
}

/** Arrêt immédiat (résiliation, erreur de saisie) : l'effet cesse aussitôt. */
export async function cancel(admin: User, id: string) {
  assertAdmin(admin);
  const [s] = await db.update(schema.subscriptions).set({ cancelledAt: new Date() }).where(and(eq(schema.subscriptions.id, id), isNull(schema.subscriptions.cancelledAt))).returning();
  if (!s) throw notFound("Abonnement");
  await synchroniser(s.establishmentId);
  await audit(admin.id, "abonnement_arrete", "subscription", id, { service: s.serviceCode });
  return s;
}

const etat = (s: Sub, now = new Date()) => s.cancelledAt ? "arrete" : s.startsAt > now ? "a_venir" : s.endsAt <= now ? "expire" : s.endsAt.getTime() - now.getTime() <= 30 * 86400000 ? "expire_bientot" : "actif";

export async function overview(admin: User) {
  assertAdmin(admin);
  const services = await listServices();
  const subs = await db.select({ s: schema.subscriptions, e: { id: schema.establishments.id, sigle: schema.establishments.sigle, nom: schema.establishments.nom, logo: schema.establishments.logo, ville: schema.establishments.ville } })
    .from(schema.subscriptions).innerJoin(schema.establishments, eq(schema.establishments.id, schema.subscriptions.establishmentId)).orderBy(desc(schema.subscriptions.createdAt)).limit(500);
  const now = new Date();
  const an = new Date(now.getFullYear(), 0, 1);
  const items = subs.map(({ s, e }) => ({ ...s, etat: etat(s, now), etablissement: e, service: services.find((x) => x.code === s.serviceCode)?.name ?? s.serviceCode }));
  const actifs = items.filter((x) => x.etat === "actif" || x.etat === "expire_bientot");
  const parService = Object.fromEntries(services.map((x) => [x.code, new Set(actifs.filter((a) => a.serviceCode === x.code).map((a) => a.establishmentId)).size]));
  const [{ n: misesEnAvant }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.establishments).where(gt(schema.establishments.featuredUntil, now));
  return {
    services: services.map((x) => ({ ...x, ecoles: parService[x.code] ?? 0 })), items,
    stats: { actifs: actifs.length, encaisseAnnee: items.filter((x) => x.createdAt >= an && !x.cancelledAt).reduce((t, x) => t + (x.amount ?? 0), 0), expirentBientot: items.filter((x) => x.etat === "expire_bientot").length, misesEnAvant },
  };
}

export function exportCsv(items: Awaited<ReturnType<typeof overview>>["items"]) {
  const esc = (v: unknown) => { const t = String(v ?? ""); return `"${(/^[=+\-@]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`; };
  const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");
  return ["École;Service;Mois;Début;Fin;État;Montant (MAD);Règlement;Référence;Saisi le", ...items.map((x) => [x.etablissement.nom, x.service, x.months, d(x.startsAt), d(x.endsAt), x.etat, x.amount ?? "", x.paymentMethod ? MOYENS[x.paymentMethod as keyof typeof MOYENS] ?? x.paymentMethod : "", x.paymentRef, d(x.createdAt)].map(esc).join(";"))].join("\n");
}

// ---------------------------------------------------------------- Rappels d'échéance (tâche quotidienne)
export async function rappels() {
  const now = new Date();
  const jours = (n: number) => new Date(now.getTime() + n * 86400000);
  const subs = await db.select({ s: schema.subscriptions, svc: schema.offerServices.name, e: { id: schema.establishments.id, nom: schema.establishments.nom } }).from(schema.subscriptions)
    .innerJoin(schema.offerServices, eq(schema.offerServices.code, schema.subscriptions.serviceCode)).innerJoin(schema.establishments, eq(schema.establishments.id, schema.subscriptions.establishmentId))
    .where(and(isNull(schema.subscriptions.cancelledAt), lte(schema.subscriptions.startsAt, now), lte(schema.subscriptions.endsAt, jours(30))));
  const admins = (await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")))).map((x) => x.id);
  let n = 0;
  for (const { s, svc, e } of subs) {
    // Une prolongation déjà enregistrée : pas de rappel.
    const [suite] = await db.select({ id: schema.subscriptions.id }).from(schema.subscriptions).where(and(eq(schema.subscriptions.establishmentId, e.id), eq(schema.subscriptions.serviceCode, s.serviceCode), isNull(schema.subscriptions.cancelledAt), gt(schema.subscriptions.endsAt, s.endsAt))).limit(1);
    if (suite) continue;
    const expire = s.endsAt <= now;
    const champ = expire ? (s.expiredNoticeAt ? null : "expiredNoticeAt") : s.endsAt <= jours(7) ? (s.reminded7At ? null : "reminded7At") : s.reminded30At ? null : "reminded30At";
    if (!champ) continue;
    const titre = expire ? `${svc} terminé depuis le ${fr(s.endsAt)}` : `${svc} : fin le ${fr(s.endsAt)}`;
    for (const m of await myMembersOf(e.id)) await notify(m, { kind: "offre", title: titre, body: expire ? "Le service est désactivé. Pour le renouveler, contactez l'équipe Navigoal (etablissements@navigoal.net)." : "Pour le renouveler sans interruption, contactez l'équipe Navigoal (etablissements@navigoal.net).", link: "/etablissement/offre", channels: ["app", "email"] });
    for (const a of admins) await notify(a, { kind: "offre", title: `${e.nom} · ${titre}`, link: "/admin/offres", channels: ["app", "email"] });
    await db.update(schema.subscriptions).set({ [champ]: now }).where(eq(schema.subscriptions.id, s.id));
    if (expire) await synchroniser(e.id);
    n++;
  }
  return { rappels: n };
}

// ---------------------------------------------------------------- Site public : écoles partenaires et visibilité
let cache: { at: number; data: { id: string; une: boolean }[] } | null = null;
/** Écoles mises en avant en ce moment (cache 2 min). `une` : première place de l'accueil. */
export async function partenaires() {
  if (cache && Date.now() - cache.at < 120_000) return cache.data;
  const now = new Date();
  const r = await db.select({ id: schema.establishments.id, homeUntil: schema.establishments.homeUntil }).from(schema.establishments).where(gt(schema.establishments.featuredUntil, now)).orderBy(sql`${schema.establishments.homeUntil} desc nulls last`, asc(schema.establishments.sigle));
  cache = { at: Date.now(), data: r.map((x) => ({ id: x.id, une: !!x.homeUntil && x.homeUntil > now })) };
  return cache.data;
}
export const viderCache = () => { cache = null; };

const mois = (d = new Date()) => d.toISOString().slice(0, 7);
/** Affichages et clics des cartes mises en avant (compteurs mensuels, sans donnée personnelle). */
export async function compterVitrine(aff: string[], clic?: string | null) {
  const ids = new Set((await partenaires()).map((x) => x.id));
  const m = mois();
  const inc = (k: string) => db.execute(sql`insert into counters (key, value) values (${k}, 1) on conflict (key) do update set value = counters.value + 1`);
  for (const id of [...new Set(aff)].filter((x) => ids.has(x)).slice(0, 40)) await inc(`vitrine:${id}:${m}:aff`);
  if (clic && ids.has(clic)) await inc(`vitrine:${clic}:${m}:clic`);
}

/** « Mon offre » : services, échéances, historique et visibilité du mois. */
export async function myOffer(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, establishmentId));
  if (!e) throw notFound("Établissement");
  const services = await listServices();
  const subs = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.establishmentId, establishmentId)).orderBy(desc(schema.subscriptions.endsAt));
  const now = new Date();
  const precedent = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const cpt = async (k: string) => Number((await db.execute<{ value: number }>(sql`select value from counters where key = ${k}`)).rows[0]?.value ?? 0);
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutPrec = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const cand = async (a: Date, b: Date) => (await db.select({ n: sql<number>`count(*)::int` }).from(schema.applications).where(and(eq(schema.applications.establishmentId, establishmentId), sql`${schema.applications.submittedAt} >= ${a} and ${schema.applications.submittedAt} < ${b}`)))[0].n;
  const [{ n: interesses }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.invitations).where(and(eq(schema.invitations.establishmentId, establishmentId), eq(schema.invitations.status, "interessee"), sql`${schema.invitations.respondedAt} >= ${debutMois}`));
  return {
    actifs: { premiumUntil: e.premiumUntil && e.premiumUntil > now ? e.premiumUntil : null, featuredUntil: e.featuredUntil && e.featuredUntil > now ? e.featuredUntil : null, homeUntil: e.homeUntil && e.homeUntil > now ? e.homeUntil : null },
    historique: subs.map((s) => ({ ...s, etat: etat(s, now), service: services.find((x) => x.code === s.serviceCode)?.name ?? s.serviceCode })),
    catalogue: services.filter((s) => s.active),
    visibilite: {
      affichages: await cpt(`vitrine:${establishmentId}:${mois(now)}:aff`), affichagesPrec: await cpt(`vitrine:${establishmentId}:${mois(precedent)}:aff`),
      clics: await cpt(`vitrine:${establishmentId}:${mois(now)}:clic`), clicsPrec: await cpt(`vitrine:${establishmentId}:${mois(precedent)}:clic`),
      candidatures: await cand(debutMois, now), candidaturesPrec: await cand(debutPrec, debutMois), interesses,
    },
  };
}

export async function listEtablissementsPourActivation(admin: User) {
  assertAdmin(admin);
  return db.select({ id: schema.establishments.id, sigle: schema.establishments.sigle, nom: schema.establishments.nom, ville: schema.establishments.ville }).from(schema.establishments).orderBy(asc(schema.establishments.sigle));
}


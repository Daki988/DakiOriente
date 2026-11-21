// Salons virtuels (novembre 2026, maquettes design/maquettes/salons.py validées le 21/11/2026).
// L'école demande un salon (date, durée, public visé, places, critères des fiches contact) ; l'admin le valide en
// enregistrant le forfait réglé, ou le refuse. Publié, il a une page publique et Navi peut le proposer aux élèves dont
// le profil correspond. Inscription avec un compte Navigoal ; « l'école peut me recontacter » est facultatif, et pour un
// mineur l'accord d'un parent est demandé. Salle Daily créée au premier accès (participants micro et caméra coupés),
// questions écrites et main levée, présence notée. Après le salon : bilan, fiches contact commandées par l'école
// (7 000 F CFA la fiche, +25 % en cascade par critère), réglées auprès de l'équipe, puis téléchargeables.
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { limiter } from "../lib/counters";
import { notify } from "./notifications";
import { childrenOf, guardiansOf } from "./guardians";
import { assertMember, myEstablishments } from "./establishments";
import { isMinor } from "./accounts";
import { etabById, formationById, type Etablissement } from "@/lib/data";
import { COUTS } from "@/lib/devis";
import { convertirDe } from "@/lib/devises";

type User = typeof schema.users.$inferSelect;
const S = schema.salons, I = schema.salonInscriptions, Q = schema.salonQuestions, F = schema.salonFiches;
export const CRITERES = { metier: "Métier ou domaine visé", formation: "Formation qui l'intéresse", admission: "Admission possible", budget: "Budget compatible" } as const;
type Critere = keyof typeof CRITERES;
const FUSEAU = "Africa/Libreville";
const quand = (d: Date) => `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU })}`;
const admins = async () => (await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")))).map((x) => x.id);
const API = () => process.env.DAILY_API_URL || "https://api.daily.co/v1";
const OUVERTURE_PRESENTATEUR = 30, OUVERTURE_PARTICIPANT = 10; // minutes avant le début

// ---------------------------------------------------------------- Prix des fiches
/** Prix d'une fiche en MAD : base du catalogue (« fiche_contact », 117 MAD = 7 000 F CFA), +25 % en cascade par critère. */
export async function prixFiche(nbCriteres: number) {
  const [o] = await db.select({ prices: schema.offerServices.prices }).from(schema.offerServices).where(eq(schema.offerServices.code, "fiche_contact"));
  const base = o?.prices?.[0]?.amount ?? 117;
  return Math.round(base * 1.25 ** Math.max(0, Math.min(4, nbCriteres)));
}

// ---------------------------------------------------------------- Demande (école)
const DemandeZ = z.object({
  titre: z.string().trim().min(5, "Donnez un titre au salon.").max(120),
  description: z.string().trim().max(1500).default(""),
  programme: z.array(z.object({ heure: z.string().max(5), texte: z.string().trim().min(1).max(120) })).max(12).default([]),
  presentateurs: z.array(z.object({ nom: z.string().trim().min(2).max(60), role: z.string().trim().max(80).default("") })).max(6).default([]),
  debut: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Date et heure invalides."),
  dureeMin: z.number().int().min(30).max(120).default(60),
  places: z.number().int().min(10).max(300).default(100),
  cibleNiveaux: z.array(z.string().max(40)).max(10).default([]),
  ciblePays: z.array(z.string().length(2)).max(20).default([]),
  cibleDomaines: z.array(z.string().max(60)).max(10).default([]),
  criteres: z.array(z.enum(["metier", "formation", "admission", "budget"])).max(4).default([]),
});

export async function demander(user: User, establishmentId: string, raw: unknown) {
  await assertMember(user, establishmentId);
  const d = DemandeZ.parse(raw);
  const debut = new Date(d.debut);
  if (debut.getTime() < Date.now() + 3 * 86400e3) throw new AppError("Prévoyez le salon au moins 3 jours à l'avance : le temps de le valider et d'inviter les élèves.");
  if (debut.getTime() > Date.now() + 365 * 86400e3) throw new AppError("Le salon doit avoir lieu dans les 12 prochains mois.");
  await limiter(`salon:${establishmentId}`, 10, 86400 * 7, "10 demandes de salon par semaine au plus.");
  const [s] = await db.insert(S).values({ ...d, criteres: [...new Set(d.criteres)], establishmentId, debut, demandePar: user.id }).returning();
  const nom = etabById[establishmentId]?.sigle ?? etabById[establishmentId]?.nom ?? establishmentId;
  for (const a of await admins()) await notify(a, { kind: "salon", title: `Salon à valider : ${nom}`, body: `« ${s.titre} », ${quand(debut)}.`, link: "/admin/salons", channels: ["app", "email"] });
  return s;
}

export async function annulerParEcole(user: User, id: string) {
  const s = await salonEcole(user, id);
  if (!["demande", "publie"].includes(s.statut)) throw new AppError("Ce salon ne peut plus être annulé.");
  await db.update(S).set({ statut: "annule" }).where(eq(S.id, id));
  if (s.statut === "publie") {
    const inscrits = await db.select({ u: I.userId }).from(I).where(eq(I.salonId, id));
    for (const { u } of inscrits) await notify(u, { kind: "salon", title: `Salon annulé : ${s.titre}`, body: `Le salon du ${quand(s.debut)} n'aura pas lieu.`, link: "/salons/", channels: ["app", "email"] });
  }
}

async function salonEcole(user: User, id: string) {
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s) throw notFound("Salon");
  await assertMember(user, s.establishmentId);
  return s;
}

/** Salons d'une école, avec les compteurs. */
export async function salonsEcole(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const rows = await db.select().from(S).where(eq(S.establishmentId, establishmentId)).orderBy(desc(S.debut));
  return Promise.all(rows.map(async (s) => ({ ...s, ...(await compteurs(s.id)), prixFiche: await prixFiche(s.criteres.length) })));
}

async function compteurs(id: string) {
  const [c] = await db.select({ inscrits: sql<number>`count(*)::int`, presents: sql<number>`count(${I.presentLe})::int`, accords: sql<number>`count(*) filter (where ${I.accordContact} and ${I.accordParent} in ('non_requis','accorde'))::int` }).from(I).where(eq(I.salonId, id));
  const [q] = await db.select({ n: sql<number>`count(*)::int`, rep: sql<number>`count(*) filter (where ${Q.repondue})::int` }).from(Q).where(eq(Q.salonId, id));
  return { inscrits: c?.inscrits ?? 0, presents: c?.presents ?? 0, accords: c?.accords ?? 0, questions: q?.n ?? 0, repondues: q?.rep ?? 0 };
}

// ---------------------------------------------------------------- Admin
export async function listeAdmin(user: User) {
  if (user.role !== "admin") throw forbidden();
  const rows = await db.select().from(S).orderBy(sql`case ${S.statut} when 'demande' then 0 else 1 end`, desc(S.debut)).limit(200);
  const fiches = await db.select().from(F).orderBy(desc(F.createdAt)).limit(200);
  return {
    salons: await Promise.all(rows.map(async (s) => ({ ...s, ecole: etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? s.establishmentId, ...(await compteurs(s.id)), prixFiche: await prixFiche(s.criteres.length) }))),
    fiches: fiches.map((f) => ({ ...f, nb: f.userIds.length, ecole: etabById[f.establishmentId]?.sigle ?? f.establishmentId, salon: rows.find((s) => s.id === f.salonId)?.titre ?? "" })),
  };
}

export async function valider(user: User, id: string, raw: unknown) {
  if (user.role !== "admin") throw forbidden();
  const b = z.object({ forfaitMad: z.number().int().min(0).max(1_000_000), paiementRef: z.string().trim().min(2, "Indiquez la référence du règlement.").max(120), naviAnnonce: z.boolean().default(true) }).parse(raw);
  const [s] = await db.update(S).set({ statut: "publie", ...b, validePar: user.id, valideLe: new Date() }).where(and(eq(S.id, id), eq(S.statut, "demande"))).returning();
  if (!s) throw new AppError("Ce salon n'est plus en attente de validation.");
  for (const m of await membres(s.establishmentId)) await notify(m, { kind: "salon", title: `Salon publié : ${s.titre}`, body: `Votre salon du ${quand(s.debut)} est en ligne${b.naviAnnonce ? " et Navi le propose aux élèves ciblés" : ""}.`, link: `/salons/${s.id}/`, channels: ["app", "email"] });
  programmerRappel(s);
  return s;
}

export async function refuser(user: User, id: string, motif: string) {
  if (user.role !== "admin") throw forbidden();
  const m = String(motif ?? "").trim().slice(0, 500);
  if (m.length < 5) throw new AppError("Indiquez le motif du refus.");
  const [s] = await db.update(S).set({ statut: "refuse", motifRefus: m }).where(and(eq(S.id, id), eq(S.statut, "demande"))).returning();
  if (!s) throw new AppError("Ce salon n'est plus en attente de validation.");
  for (const u of await membres(s.establishmentId)) await notify(u, { kind: "salon", title: `Salon non retenu : ${s.titre}`, body: m, link: "/etablissement/salons", channels: ["app", "email"] });
}

const membres = async (establishmentId: string) => (await db.select({ u: schema.establishmentMembers.userId }).from(schema.establishmentMembers).where(eq(schema.establishmentMembers.establishmentId, establishmentId))).map((x) => x.u);

// ---------------------------------------------------------------- Public
const publicDe = (s: typeof S.$inferSelect, inscrits: number) => {
  const e = etabById[s.establishmentId];
  return {
    id: s.id, titre: s.titre, description: s.description, programme: s.programme, presentateurs: s.presentateurs, debut: s.debut, dureeMin: s.dureeMin, places: s.places,
    inscrits, placesRestantes: Math.max(0, s.places - inscrits), cibleNiveaux: s.cibleNiveaux, ciblePays: s.ciblePays, cibleDomaines: s.cibleDomaines,
    ecole: { id: s.establishmentId, nom: e?.nom ?? s.establishmentId, sigle: (e?.sigle ?? null) as string | null, ville: e?.ville ?? "", logo: (e?.logo ?? null) as string | null },
  };
};
async function nbInscrits(id: string) { const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(I).where(eq(I.salonId, id)); return c?.n ?? 0; }

/** Salons publiés à venir (ou en cours). */
export async function salonsPublics() {
  const rows = await db.select().from(S).where(and(eq(S.statut, "publie"), gt(S.debut, new Date(Date.now() - 3 * 3600e3)))).orderBy(asc(S.debut)).limit(60);
  return Promise.all(rows.map(async (s) => publicDe(s, await nbInscrits(s.id))));
}

export async function salonPublic(id: string, user?: User | null) {
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s || (s.statut !== "publie" && !(user && (user.role === "admin" || (user.role === "etablissement" && (await membres(s.establishmentId)).includes(user.id)))))) throw notFound("Salon");
  const [ins] = user ? await db.select().from(I).where(and(eq(I.salonId, id), eq(I.userId, user.id))) : [];
  const organisateur = !!user && (user.role === "admin" || (await membres(s.establishmentId)).includes(user.id));
  return { ...publicDe(s, await nbInscrits(id)), statut: s.statut, termine: s.debut.getTime() + (s.dureeMin + 30) * 60e3 < Date.now(), inscription: ins ? { accordContact: ins.accordContact, accordParent: ins.accordParent } : null, organisateur };
}

// ---------------------------------------------------------------- Inscription
export async function inscrire(user: User, id: string, raw: unknown, opts: { viaNavi?: boolean } = {}) {
  if (!["eleve", "etudiant", "parent"].includes(user.role)) throw new AppError("L'inscription aux salons est réservée aux élèves, étudiants et parents.", 403, "interdit");
  const b = z.object({ accordContact: z.boolean().default(false) }).parse(raw ?? {});
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s || s.statut !== "publie") throw notFound("Salon");
  if (s.debut.getTime() + s.dureeMin * 60e3 < Date.now()) throw new AppError("Ce salon est terminé.");
  const [deja] = await db.select().from(I).where(and(eq(I.salonId, id), eq(I.userId, user.id)));
  if (!deja && (await nbInscrits(id)) >= s.places) throw new AppError("Ce salon est complet.");
  const accord = b.accordContact && user.role !== "parent";
  const mineur = accord && isMinor(user.birthYear);
  const parents = mineur ? (await guardiansOf(user.id)).filter((g) => g.link.status === "actif" && g.parent?.id) : [];
  const accordParent = !accord ? "non_requis" : mineur ? "en_attente" : "non_requis";
  if (deja) {
    // Changer d'avis sur le contact : un accord retiré l'est tout de suite ; un nouvel accord d'un mineur repasse par le parent.
    await db.update(I).set({ accordContact: accord, accordParent: deja.accordContact === accord ? deja.accordParent : accordParent }).where(and(eq(I.salonId, id), eq(I.userId, user.id)));
  } else {
    await db.insert(I).values({ salonId: id, userId: user.id, accordContact: accord, accordParent, viaNavi: !!opts.viaNavi });
    await notify(user.id, { kind: "salon", title: `Inscrit·e au salon : ${s.titre}`, body: `${quand(s.debut)} (heure de Libreville). Le lien s'ouvre 10 minutes avant ; rappel le matin et 15 minutes avant.`, link: `/salons/${id}/`, channels: ["app", "email"] });
  }
  if (accordParent === "en_attente" && (!deja || !deja.accordContact)) {
    const nom = etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? "l'école";
    for (const g of parents) await notify(g.parent!.id, { kind: "salon", title: `Accord demandé : ${user.firstName} souhaite que ${nom} puisse la ou le recontacter`, body: `Salon « ${s.titre} » du ${quand(s.debut)}. Sans votre accord, ses coordonnées ne sont pas transmises.`, link: "/parent/salons/", channels: ["app", "email"] });
  }
  return { inscrit: true, accordContact: accord, accordParent: deja && deja.accordContact === accord ? deja.accordParent : accordParent };
}

export async function desinscrire(user: User, id: string) {
  await db.delete(I).where(and(eq(I.salonId, id), eq(I.userId, user.id)));
}

/** Parent : accords demandés par ses enfants (fiche transmise à l'école organisatrice). */
export async function accordsParent(user: User) {
  if (user.role !== "parent") throw forbidden();
  const enfants = (await childrenOf(user.id)).filter((c) => c.link.status === "actif").map((c) => ({ id: c.child.id, prenom: c.child.firstName }));
  if (!enfants.length) return [];
  const rows = await db.select({ i: I, s: S }).from(I).innerJoin(S, eq(S.id, I.salonId)).where(and(inArray(I.userId, enfants.map((e) => e.id)), eq(I.accordContact, true))).orderBy(desc(S.debut));
  return rows.map(({ i, s }) => ({ salonId: s.id, enfantId: i.userId, enfant: enfants.find((e) => e.id === i.userId)?.prenom ?? "", titre: s.titre, debut: s.debut, ecole: etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? "", accordParent: i.accordParent }));
}

export async function repondreAccord(user: User, salonId: string, enfantId: string, accepte: boolean) {
  if (user.role !== "parent") throw forbidden();
  if (!(await childrenOf(user.id)).some((c) => c.link.status === "actif" && c.child.id === enfantId)) throw forbidden();
  const [r] = await db.update(I).set({ accordParent: accepte ? "accorde" : "refuse", parentId: user.id }).where(and(eq(I.salonId, salonId), eq(I.userId, enfantId), eq(I.accordContact, true))).returning();
  if (!r) throw notFound("Demande d'accord");
  return { accordParent: r.accordParent };
}

// ---------------------------------------------------------------- Salle en direct
async function daily<T>(chemin: string, corps: unknown): Promise<T> {
  const r = await fetch(`${API()}${chemin}`, { method: "POST", headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(corps), signal: AbortSignal.timeout(10000) });
  if (!r.ok) { console.error("Daily (salon) :", r.status, (await r.text().catch(() => "")).slice(0, 300)); throw new AppError("Le service d'appel ne répond pas. Réessaie dans un instant.", 502, "daily"); }
  return r.json() as Promise<T>;
}

/** Jeton pour la salle : présentateurs (membres de l'école, équipe) en hôtes, inscrits micro et caméra coupés. */
export async function rejoindre(user: User, id: string) {
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s || s.statut !== "publie") throw notFound("Salon");
  const presentateur = user.role === "admin" || (await membres(s.establishmentId)).includes(user.id);
  const [ins] = await db.select().from(I).where(and(eq(I.salonId, id), eq(I.userId, user.id)));
  if (!presentateur && !ins) throw new AppError("Inscris-toi d'abord au salon.", 403, "non_inscrit");
  const fin = new Date(s.debut.getTime() + (s.dureeMin + 30) * 60e3);
  const base = { id: s.id, titre: s.titre, ecole: etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? "", debut: s.debut, dureeMin: s.dureeMin, presentateur };
  if (fin <= new Date()) return { ...base, termine: true as const };
  const ouvre = s.debut.getTime() - (presentateur ? OUVERTURE_PRESENTATEUR : OUVERTURE_PARTICIPANT) * 60e3;
  if (Date.now() < ouvre) return { ...base, termine: false as const, aVenir: true as const, ouvreLe: new Date(ouvre) };
  if (!process.env.DAILY_API_KEY) throw new AppError("Les salons en direct ne sont pas encore activés.", 503, "appels_inactifs");
  let salle = s.salle, url = s.url;
  if (!salle || !url) {
    const r = await daily<{ name: string; url: string }>("/rooms", { name: `navigoal-salon-${crypto.randomUUID().slice(0, 12)}`, privacy: "private",
      properties: { exp: Math.floor(fin.getTime() / 1000), eject_at_room_exp: true, enable_prejoin_ui: true, lang: "fr", max_participants: Math.min(s.places + 10, 200), enable_chat: false, start_audio_off: true, start_video_off: true } });
    const [m] = await db.update(S).set({ salle: r.name, url: r.url }).where(and(eq(S.id, id), isNull(S.salle))).returning();
    if (m) { salle = m.salle; url = m.url; } else { const [x] = await db.select().from(S).where(eq(S.id, id)); salle = x.salle; url = x.url; }
  }
  const nom = presentateur ? `${user.firstName} · ${base.ecole}` : `${user.firstName} ${user.lastName.charAt(0)}.`;
  const { token } = await daily<{ token: string }>("/meeting-tokens", { properties: { room_name: salle, user_name: nom, user_id: user.id, is_owner: presentateur, exp: Math.floor(fin.getTime() / 1000), eject_at_token_exp: true, start_audio_off: !presentateur, start_video_off: !presentateur, lang: "fr" } });
  if (ins && !ins.presentLe) await db.update(I).set({ presentLe: new Date() }).where(and(eq(I.salonId, id), eq(I.userId, user.id)));
  return { ...base, termine: false as const, url: url!, jeton: token };
}

// ---------------------------------------------------------------- Questions
async function accesSalle(user: User, id: string) {
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s || s.statut !== "publie") throw notFound("Salon");
  const presentateur = user.role === "admin" || (await membres(s.establishmentId)).includes(user.id);
  if (!presentateur) { const [ins] = await db.select().from(I).where(and(eq(I.salonId, id), eq(I.userId, user.id))); if (!ins) throw notFound("Salon"); }
  return { s, presentateur };
}

export async function questions(user: User, id: string) {
  const { presentateur } = await accesSalle(user, id);
  const rows = await db.select({ q: Q, prenom: schema.users.firstName, pays: schema.users.country }).from(Q).innerJoin(schema.users, eq(schema.users.id, Q.userId)).where(eq(Q.salonId, id)).orderBy(asc(Q.createdAt)).limit(300);
  return { presentateur, questions: rows.map(({ q, prenom, pays }) => ({ id: q.id, texte: q.texte, main: q.main, repondue: q.repondue, auteur: `${prenom}${pays ? ` · ${pays}` : ""}`, moi: q.userId === user.id, createdAt: q.createdAt })) };
}

export async function poserQuestion(user: User, id: string, raw: unknown) {
  await accesSalle(user, id);
  const b = z.object({ texte: z.string().trim().max(500).default(""), main: z.boolean().default(false) }).parse(raw ?? {});
  if (!b.main && b.texte.length < 3) throw new AppError("Écris ta question.");
  await limiter(`salonq:${id}:${user.id}`, 20, 3600, "20 questions par heure au plus.");
  const [q] = await db.insert(Q).values({ salonId: id, userId: user.id, texte: b.main && !b.texte ? "souhaite prendre la parole" : b.texte, main: b.main }).returning();
  return q;
}

export async function marquerRepondue(user: User, id: string, questionId: string) {
  const { presentateur } = await accesSalle(user, id);
  if (!presentateur) throw forbidden();
  await db.update(Q).set({ repondue: true }).where(and(eq(Q.id, questionId), eq(Q.salonId, id)));
}

// ---------------------------------------------------------------- Ciblage des fiches et de Navi
const ecolesFormations = (e: Etablissement) => e.formations.map((f) => formationById[f]).filter(Boolean);

/** Critères satisfaits par un élève pour une école (pour les fiches contact). */
export async function criteresSatisfaits(userId: string, e: Etablissement): Promise<Set<Critere>> {
  const ok = new Set<Critere>();
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const fs = ecolesFormations(e);
  const metiers = new Set(fs.flatMap((f) => f.metiers)), domaines = new Set(fs.map((f) => f.domaine));
  if (p && (p.targetJobs.some((m) => metiers.has(m)) || (p.domain && domaines.has(p.domain)))) ok.add("metier");
  const favs = await db.select({ kind: schema.favorites.kind, item: schema.favorites.itemId }).from(schema.favorites).where(eq(schema.favorites.userId, userId));
  if (favs.some((f) => (f.kind === "formation" && e.formations.includes(f.item)) || (f.kind === "etablissement" && f.item === e.id))) ok.add("formation");
  if (p?.serie && fs.some((f) => (f.series_recommandees[e.pays] ?? []).includes(p.serie!))) ok.add("admission");
  const budget = p?.preferences?.budgetAnnuel;
  if (budget) {
    const mad = convertirDe(budget, p!.preferences.devise ?? "MAD", "MAD");
    const seuil = e.frais_publies?.min ?? COUTS[e.pays]?.scolarite_annuelle?.[e.type]?.min;
    if (mad != null && seuil != null && mad >= seuil) ok.add("budget");
  }
  return ok;
}

/** Pour Navi : salons publiés à venir qui correspondent au profil de l'élève (pays, domaines, niveau), annonce autorisée. */
export async function salonsPourEleve(user: User | null) {
  const rows = await db.select().from(S).where(and(eq(S.statut, "publie"), eq(S.naviAnnonce, true), gt(S.debut, new Date()), lt(S.debut, new Date(Date.now() + 45 * 86400e3)))).orderBy(asc(S.debut)).limit(30);
  let p: typeof schema.profiles.$inferSelect | undefined;
  if (user) [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const inscrits = user ? new Set((await db.select({ s: I.salonId }).from(I).where(eq(I.userId, user.id))).map((x) => x.s)) : new Set<string>();
  const out = [];
  for (const s of rows) {
    if (inscrits.has(s.id)) continue;
    const e = etabById[s.establishmentId];
    let score = 0;
    if (user?.country && s.ciblePays.length && !s.ciblePays.includes(user.country)) continue;
    if (p?.level && s.cibleNiveaux.length && !s.cibleNiveaux.includes(p.level)) continue;
    if (e && p) { const c = await criteresSatisfaits(user!.id, e); score = c.size; }
    if (p?.domain && s.cibleDomaines.includes(p.domain)) score += 2;
    out.push({ id: s.id, titre: s.titre, ecole: e?.sigle ?? e?.nom ?? "", ecole_id: s.establishmentId, debut: quand(s.debut), duree_min: s.dureeMin, places_restantes: Math.max(0, s.places - (await nbInscrits(s.id))), lien: `/salons/${s.id}/`, pertinence: score });
  }
  return out.sort((a, b) => b.pertinence - a.pertinence).slice(0, 5);
}

// ---------------------------------------------------------------- Bilan, fiches, messages (école)
export async function bilan(user: User, id: string) {
  const s = await salonEcole(user, id);
  const e = etabById[s.establishmentId];
  const rows = await db.select({ i: I, u: { id: schema.users.id, prenom: schema.users.firstName, nom: schema.users.lastName, pays: schema.users.country }, level: schema.profiles.level, serie: schema.profiles.serie })
    .from(I).innerJoin(schema.users, eq(schema.users.id, I.userId)).leftJoin(schema.profiles, eq(schema.profiles.userId, I.userId)).where(eq(I.salonId, id)).orderBy(asc(I.createdAt));
  const candidats = new Set((await db.select({ u: schema.applications.studentId }).from(schema.applications)
    .where(and(eq(schema.applications.establishmentId, s.establishmentId), gte(schema.applications.createdAt, s.debut), isNotNull(schema.applications.submittedAt)))).map((x) => x.u));
  const achetes = new Set((await db.select({ u: F.userIds }).from(F).where(and(eq(F.salonId, id), sql`${F.statut} <> 'annulee'`))).flatMap((x) => x.u));
  const eligibles: string[] = [];
  for (const r of rows) {
    if (!r.i.accordContact || !["non_requis", "accorde"].includes(r.i.accordParent) || achetes.has(r.u.id) || !e) continue;
    const c = await criteresSatisfaits(r.u.id, e);
    if (s.criteres.every((k) => c.has(k as Critere))) eligibles.push(r.u.id);
  }
  const prix = await prixFiche(s.criteres.length);
  return {
    salon: { ...s, ...(await compteurs(id)) }, prixFiche: prix, criteres: s.criteres.map((k) => CRITERES[k as Critere]),
    participants: rows.map((r) => ({ prenom: r.u.prenom, initiale: `${r.u.nom.charAt(0)}.`, pays: r.u.pays, niveau: r.level, serie: r.serie, present: !!r.i.presentLe, viaNavi: r.i.viaNavi, candidature: candidats.has(r.u.id), accord: r.i.accordContact && ["non_requis", "accorde"].includes(r.i.accordParent) })),
    candidatures: rows.filter((r) => candidats.has(r.u.id)).length,
    fichesDisponibles: eligibles.length, montantFiches: eligibles.length * prix,
    commandes: (await db.select().from(F).where(eq(F.salonId, id)).orderBy(desc(F.createdAt))).map((f) => ({ id: f.id, nb: f.userIds.length, montantMad: f.montantMad, statut: f.statut, createdAt: f.createdAt })),
  };
}

export async function commanderFiches(user: User, id: string) {
  const b = await bilan(user, id);
  if (!b.fichesDisponibles) throw new AppError("Aucune nouvelle fiche disponible pour ce salon.");
  const s = b.salon, e = etabById[s.establishmentId]!;
  const ids: string[] = [];
  for (const r of await db.select({ u: I.userId }).from(I).where(and(eq(I.salonId, id), eq(I.accordContact, true), inArray(I.accordParent, ["non_requis", "accorde"])))) {
    const c = await criteresSatisfaits(r.u, e);
    if (s.criteres.every((k) => c.has(k as Critere))) ids.push(r.u);
  }
  const achetes = new Set((await db.select({ u: F.userIds }).from(F).where(and(eq(F.salonId, id), sql`${F.statut} <> 'annulee'`))).flatMap((x) => x.u));
  const nouveaux = ids.filter((x) => !achetes.has(x));
  if (!nouveaux.length) throw new AppError("Aucune nouvelle fiche disponible pour ce salon.");
  const [f] = await db.insert(F).values({ salonId: id, establishmentId: s.establishmentId, userIds: nouveaux, criteres: s.criteres, prixUnitMad: b.prixFiche, montantMad: nouveaux.length * b.prixFiche, demandePar: user.id }).returning();
  for (const a of await admins()) await notify(a, { kind: "salon", title: `Fiches commandées : ${e.sigle ?? e.nom}`, body: `${nouveaux.length} fiches × ${b.prixFiche} MAD = ${f.montantMad} MAD (salon « ${s.titre} »). À débloquer après règlement.`, link: "/admin/salons", channels: ["app", "email"] });
  return f;
}

export async function payerFiches(user: User, ficheId: string, ref: string) {
  if (user.role !== "admin") throw forbidden();
  const r = String(ref ?? "").trim().slice(0, 120);
  if (r.length < 2) throw new AppError("Indiquez la référence du règlement.");
  const [f] = await db.update(F).set({ statut: "payee", paiementRef: r, payeeLe: new Date() }).where(and(eq(F.id, ficheId), eq(F.statut, "en_attente"))).returning();
  if (!f) throw new AppError("Cette commande n'est plus en attente.");
  for (const m of await membres(f.establishmentId)) await notify(m, { kind: "salon", title: `Fiches contact disponibles (${f.userIds.length})`, body: "Le règlement est enregistré : téléchargez les fiches depuis le bilan du salon.", link: `/etablissement/salons/${f.salonId}/`, channels: ["app", "email"] });
  return f;
}

/** Fiches réglées en CSV : seuls les élèves dont l'accord (et celui du parent) est toujours valable. */
export async function csvFiches(user: User, ficheId: string) {
  const [f] = await db.select().from(F).where(eq(F.id, ficheId));
  if (!f) throw notFound("Fiches");
  await assertMember(user, f.establishmentId);
  if (f.statut !== "payee") throw new AppError("Ces fiches seront disponibles après le règlement.", 402, "non_reglee");
  const rows = await db.select({ i: I, u: schema.users, p: schema.profiles }).from(I).innerJoin(schema.users, eq(schema.users.id, I.userId)).leftJoin(schema.profiles, eq(schema.profiles.userId, I.userId))
    .where(and(eq(I.salonId, f.salonId), inArray(I.userId, f.userIds), eq(I.accordContact, true), inArray(I.accordParent, ["non_requis", "accorde"])));
  const cel = (v: unknown) => { const t = String(v ?? "").replace(/"/g, '""'); return /^[=+\-@]/.test(t) ? `"'${t}"` : `"${t}"`; };
  const lignes = [["Prénom", "Nom", "Pays", "Ville", "Niveau", "Série", "Domaine", "Métiers visés", "E-mail", "Téléphone", "Présent au salon"].map(cel).join(";")];
  for (const { i, u, p } of rows) lignes.push([u.firstName, u.lastName, u.country, u.city, p?.level, p?.serie, p?.domain, (p?.targetJobs ?? []).join(", "), u.email, u.phone, i.presentLe ? "oui" : "non"].map(cel).join(";"));
  return "﻿" + lignes.join("\r\n") + "\r\n";
}

/** Message de l'école aux participants (ou aux absents) : notification et e-mail, sans transmettre leurs coordonnées. */
export async function ecrireParticipants(user: User, id: string, raw: unknown) {
  const s = await salonEcole(user, id);
  const b = z.object({ texte: z.string().trim().min(10, "Écrivez votre message.").max(1000), cible: z.enum(["tous", "presents", "absents"]).default("tous") }).parse(raw);
  await limiter(`salonmsg:${id}`, 5, 86400, "5 messages par jour et par salon au plus.");
  const rows = await db.select({ u: I.userId, p: I.presentLe }).from(I).where(eq(I.salonId, id));
  const cibles = rows.filter((r) => b.cible === "tous" || (b.cible === "presents" ? r.p : !r.p));
  const nom = etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? "L'école";
  for (const r of cibles) await notify(r.u, { kind: "salon", title: `${nom} : suite du salon « ${s.titre} »`, body: b.texte, link: `/etablissements/${s.establishmentId}/`, channels: ["app", "email"] });
  return { envoyes: cibles.length };
}

// ---------------------------------------------------------------- Agenda, rappels
/** Salons auxquels la personne est inscrite (ou qu'elle organise), pour sa page « Rendez-vous ». */
export async function mesSalons(user: User) {
  const depuis = new Date(Date.now() - 3 * 3600e3);
  let ids: string[] = [];
  if (user.role === "etablissement") { const es = (await myEstablishments(user.id)).map((x) => x.e.id); if (es.length) ids = (await db.select({ id: S.id }).from(S).where(and(inArray(S.establishmentId, es), eq(S.statut, "publie"), gt(S.debut, depuis)))).map((x) => x.id); }
  else {
    const qui = [user.id];
    if (user.role === "parent") for (const c of await childrenOf(user.id)) if (c.link.status === "actif") qui.push(c.child.id);
    ids = (await db.select({ id: I.salonId }).from(I).where(inArray(I.userId, qui))).map((x) => x.id);
  }
  if (!ids.length) return [];
  const rows = await db.select().from(S).where(and(inArray(S.id, ids), eq(S.statut, "publie"), gt(S.debut, depuis))).orderBy(asc(S.debut));
  return rows.map((s) => ({ id: s.id, titre: s.titre, debut: s.debut, dureeMin: s.dureeMin, ecole: etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? "", organisateur: user.role === "etablissement" }));
}

const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;
async function prevenirInscrits(s: typeof S.$inferSelect, titre: string, cle: string) {
  if (!(await premiereFois(cle))) return 0;
  const qui = new Set([...(await db.select({ u: I.userId }).from(I).where(eq(I.salonId, s.id))).map((x) => x.u), ...(await membres(s.establishmentId))]);
  for (const u of qui) await notify(u, { kind: "salon", title: titre, body: `« ${s.titre} » · ${etabById[s.establishmentId]?.sigle ?? ""}`.trim(), link: `/salons/${s.id}/direct/`, channels: ["app", "email"] });
  return qui.size;
}

const minuteurs = new Map<string, ReturnType<typeof setTimeout>>();
export function programmerRappel(s: { id: string; debut: Date; statut: string }) {
  const ancien = minuteurs.get(s.id); if (ancien) clearTimeout(ancien);
  if (s.statut !== "publie") return;
  const dans = s.debut.getTime() - 15 * 60e3 - Date.now();
  if (dans < -10 * 60e3 || dans > 20 * 86400e3) return;
  minuteurs.set(s.id, setTimeout(async () => {
    minuteurs.delete(s.id);
    try { const [x] = await db.select().from(S).where(eq(S.id, s.id)); if (x?.statut === "publie") await prevenirInscrits(x, `Le salon commence dans 15 minutes (${x.debut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU })})`, `salon15:${x.id}:${x.debut.toISOString()}`); }
    catch (e) { console.error("Rappel de salon :", e); }
  }, Math.max(0, dans)));
}

export async function chargerRappels() {
  const futurs = await db.select({ id: S.id, debut: S.debut, statut: S.statut }).from(S).where(and(eq(S.statut, "publie"), gt(S.debut, new Date(Date.now() - 10 * 60e3)), lt(S.debut, new Date(Date.now() + 20 * 86400e3))));
  futurs.forEach(programmerRappel);
  return futurs.length;
}

/** Tâche quotidienne : « Salon aujourd'hui » aux inscrits et à l'école, une fois. */
export async function rappelsDuJour(maintenant = new Date()) {
  const rows = await db.select().from(S).where(and(eq(S.statut, "publie"), gte(S.debut, maintenant), lt(S.debut, new Date(maintenant.getTime() + 24 * 3600e3))));
  let n = 0;
  for (const s of rows) n += await prevenirInscrits(s, `Salon ${quand(s.debut)}`, `salonjour:${s.id}:${s.debut.toISOString()}`);
  return { rappels: n };
}

/** Fichier agenda (.ics) d'un salon, pour un inscrit ou l'école. */
export async function agendaIcs(user: User, id: string, base: string) {
  const [s] = await db.select().from(S).where(eq(S.id, id));
  if (!s || s.statut !== "publie") throw notFound("Salon");
  const ok = user.role === "admin" || (await membres(s.establishmentId)).includes(user.id) || (await db.select().from(I).where(and(eq(I.salonId, id), eq(I.userId, user.id)))).length > 0;
  if (!ok) throw notFound("Salon");
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[\;,]/g, (x) => `\\${x}`).replace(/\n/g, "\\n");
  const lien = `${base}/salons/${s.id}/direct/`;
  const titre = `Salon virtuel : ${s.titre} (${etabById[s.establishmentId]?.sigle ?? etabById[s.establishmentId]?.nom ?? ""})`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Navigoal//Salons//FR", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:salon-${s.id}@navigoal.net`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(s.debut)}`, `DTEND:${f(new Date(s.debut.getTime() + s.dureeMin * 60e3))}`, `SUMMARY:${esc(titre)}`, `DESCRIPTION:${esc(`Entrer dans la salle : ${lien}`)}`, `URL:${lien}`, `LOCATION:${lien}`,
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", `DESCRIPTION:${esc(titre)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}

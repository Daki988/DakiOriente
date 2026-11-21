// Appels audio ou vidéo (Daily Prebuilt) lancés depuis un fil de messagerie : entretien d'admission (école ↔ candidat),
// visite virtuelle d'un logement (bailleur ↔ locataire), rendez-vous avec un conseiller ou échange direct avec l'équipe.
// Salle privée qui expire au bout de DUREE ; on n'y entre qu'avec un jeton nominatif remis aux participants du fil,
// à l'équipe Navigoal et aux parents d'un élève du fil. Aucun enregistrement. Actif seulement si DAILY_API_KEY est défini.
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { limiter } from "../lib/counters";
import { childrenOf, guardiansOf } from "./guardians";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
const DUREE_MIN = 120;
const OUVERTURE_MIN = 10; // un rendez-vous planifié s'ouvre 10 min avant l'heure
const LANCEURS = ["etablissement", "bailleur", "conseiller", "admin"];
const API = () => process.env.DAILY_API_URL || "https://api.daily.co/v1";

export const appelsActifs = () => !!process.env.DAILY_API_KEY;

async function daily<T>(chemin: string, corps: unknown): Promise<T> {
  const r = await fetch(`${API()}${chemin}`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(corps), signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    console.error("Daily :", r.status, (await r.text().catch(() => "")).slice(0, 300));
    throw new AppError("Le service d'appel ne répond pas. Réessaie dans un instant.", 502, "daily");
  }
  return r.json() as Promise<T>;
}

async function participants(conversationId: string) {
  return db.select({ id: schema.users.id, role: schema.users.role }).from(schema.conversationParticipants)
    .innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(eq(schema.conversationParticipants.conversationId, conversationId));
}

/** Peut rejoindre : participant du fil, équipe Navigoal, ou parent (lien actif) d'un élève du fil. */
async function peutRejoindre(user: User, conversationId: string) {
  if (user.role === "admin") return true;
  const parts = await participants(conversationId);
  if (parts.some((p) => p.id === user.id)) return true;
  if (user.role !== "parent") return false;
  for (const p of parts.filter((x) => x.role === "eleve" || x.role === "etudiant")) {
    if ((await guardiansOf(p.id)).some((g) => g.link.status === "actif" && g.parent?.id === user.id)) return true;
  }
  return false;
}

export async function lancerAppel(user: User, conversationId: string, opts: { audioSeul?: boolean } = {}) {
  // Droits vérifiés avant tout : un compte sans accès au fil ne doit rien apprendre, même si les appels sont coupés.
  if (!LANCEURS.includes(user.role)) throw forbidden();
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId));
  if (!c) throw notFound("Conversation");
  const parts = await participants(conversationId);
  if (user.role !== "admin" && !parts.some((p) => p.id === user.id)) throw forbidden();
  if (!appelsActifs()) throw new AppError("Les appels ne sont pas encore activés.", 503, "appels_inactifs");
  // Un appel encore ouvert dans ce fil est réutilisé (pas de doublon si l'on clique deux fois).
  const [enCours] = await db.select().from(schema.appels).where(and(eq(schema.appels.conversationId, conversationId), gt(schema.appels.expire, new Date(Date.now() + 15 * 60e3)),
    isNull(schema.appels.annuleLe), isNull(schema.appels.prevuLe), isNotNull(schema.appels.salle))).orderBy(desc(schema.appels.createdAt)).limit(1);
  if (enCours) return enCours;
  await limiter(`appel:${user.id}`, 20, 86400, "Vous avez lancé 20 appels aujourd'hui : réessayez demain.");
  const audioSeul = !!opts.audioSeul;
  const expire = new Date(Date.now() + DUREE_MIN * 60e3);
  const salle = await daily<{ name: string; url: string }>("/rooms", {
    name: `navigoal-${crypto.randomUUID().slice(0, 13)}`, privacy: "private",
    properties: { exp: Math.floor(expire.getTime() / 1000), eject_at_room_exp: true, enable_prejoin_ui: true, lang: "fr", start_video_off: audioSeul },
  });
  const [a] = await db.insert(schema.appels).values({ conversationId, salle: salle.name, url: salle.url, audioSeul, creePar: user.id, expire }).returning();
  const lien = `/appel/${a.id}/`;
  const nature = audioSeul ? "Appel audio" : "Appel vidéo";
  const heure = expire.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Libreville" });
  await db.insert(schema.messages).values({ conversationId, authorId: user.id, body: `📞 ${nature} lancé. Rejoindre : ${lien} (ouvert jusqu'à ${heure}, heure de Libreville).`, onBehalfOf: null });
  await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conversationId));
  const prevenir = new Set(parts.filter((p) => p.id !== user.id).map((p) => p.id));
  for (const p of parts.filter((x) => x.role === "eleve" || x.role === "etudiant")) {
    for (const g of await guardiansOf(p.id)) if (g.link.status === "actif" && g.parent?.id) prevenir.add(g.parent.id);
  }
  for (const id of prevenir) await notify(id, { kind: "appel", title: `${nature} : ${c.subject}`, body: `${user.firstName} vous attend. Rejoignez depuis votre téléphone ou votre ordinateur.`, link: lien, channels: ["app", "email"] });
  return a;
}

/** Informations de l'appel et jeton nominatif pour entrer dans la salle Daily. */
export async function rejoindre(user: User, appelId: string) {
  const [a] = await db.select().from(schema.appels).where(eq(schema.appels.id, appelId));
  if (!a || !(await peutRejoindre(user, a.conversationId))) throw notFound("Appel");
  const [c] = await db.select({ sujet: schema.conversations.subject }).from(schema.conversations).where(eq(schema.conversations.id, a.conversationId));
  const base = { id: a.id, conversationId: a.conversationId, sujet: c?.sujet ?? "", objet: a.objet, audioSeul: a.audioSeul, expire: a.expire, prevuLe: a.prevuLe, dureeMin: a.dureeMin };
  if (a.annuleLe) return { ...base, termine: true as const, annule: true as const };
  if (a.expire <= new Date()) return { ...base, termine: true as const };
  // Rendez-vous planifié : la salle ouvre OUVERTURE_MIN minutes avant l'heure prévue.
  if (a.prevuLe && a.prevuLe.getTime() - OUVERTURE_MIN * 60e3 > Date.now()) return { ...base, termine: false as const, aVenir: true as const };
  if (!appelsActifs()) throw new AppError("Les appels ne sont pas encore activés.", 503, "appels_inactifs");
  if (!a.salle || !a.url) {
    const salle = await daily<{ name: string; url: string }>("/rooms", {
      name: `navigoal-${crypto.randomUUID().slice(0, 13)}`, privacy: "private",
      properties: { exp: Math.floor(a.expire.getTime() / 1000), eject_at_room_exp: true, enable_prejoin_ui: true, lang: "fr", start_video_off: a.audioSeul },
    });
    // Deux personnes qui entrent au même instant : la première salle enregistrée l'emporte.
    const [maj] = await db.update(schema.appels).set({ salle: salle.name, url: salle.url }).where(and(eq(schema.appels.id, a.id), isNull(schema.appels.salle))).returning();
    if (maj) { a.salle = maj.salle; a.url = maj.url; }
    else { const [x] = await db.select().from(schema.appels).where(eq(schema.appels.id, a.id)); a.salle = x.salle; a.url = x.url; }
  }
  const nom = user.role === "admin" ? `${user.firstName} · Navigoal` : `${user.firstName} ${user.lastName.charAt(0)}.`;
  const { token } = await daily<{ token: string }>("/meeting-tokens", {
    properties: { room_name: a.salle!, user_name: nom, user_id: user.id, is_owner: user.id === a.creePar || user.role === "admin", exp: Math.floor(a.expire.getTime() / 1000), eject_at_token_exp: true, start_video_off: a.audioSeul, lang: "fr" },
  });
  return { ...base, termine: false as const, url: a.url!, jeton: token };
}

// ---------------------------------------------------------------- Rendez-vous planifiés (novembre 2026)
// L'école, le bailleur, le conseiller ou l'équipe fixe un créneau depuis le fil : le lien /appel/<id>/ existe tout de
// suite, la salle Daily n'est créée qu'au premier accès (10 min avant). Prévenus : participants du fil et parents des
// élèves du fil, à la planification, le matin du jour (tâche quotidienne) et 15 min avant (minuteur du serveur).
const FUSEAU = "Africa/Libreville";
const quand = (d: Date) => `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU })}`;
const heure = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });

async function aPrevenir(conversationId: string, sauf?: string) {
  const parts = await participants(conversationId);
  const ids = new Set(parts.filter((p) => p.id !== sauf).map((p) => p.id));
  for (const p of parts.filter((x) => x.role === "eleve" || x.role === "etudiant")) {
    for (const g of await guardiansOf(p.id)) if (g.link.status === "actif" && g.parent?.id && g.parent.id !== sauf) ids.add(g.parent.id);
  }
  return [...ids];
}

function lireCreneau(raw: unknown) {
  const b = (raw ?? {}) as { debut?: string; dureeMin?: number; audioSeul?: boolean; objet?: string };
  const debut = new Date(String(b.debut ?? ""));
  if (Number.isNaN(debut.getTime())) throw new AppError("Choisissez une date et une heure.");
  if (debut.getTime() < Date.now() + 5 * 60e3) throw new AppError("Le rendez-vous doit commencer dans 5 minutes au moins.");
  if (debut.getTime() > Date.now() + 120 * 86400e3) throw new AppError("Le rendez-vous doit avoir lieu dans les 4 prochains mois.");
  const dureeMin = [15, 30, 45, 60, 90].includes(Number(b.dureeMin)) ? Number(b.dureeMin) : 30;
  const objet = String(b.objet ?? "").trim().slice(0, 140) || null;
  return { debut, dureeMin, audioSeul: !!b.audioSeul, objet };
}
const fin = (debut: Date, dureeMin: number) => new Date(debut.getTime() + (dureeMin + 30) * 60e3); // 30 min de marge

export async function planifierAppel(user: User, conversationId: string, raw: unknown) {
  if (!LANCEURS.includes(user.role)) throw forbidden();
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId));
  if (!c) throw notFound("Conversation");
  if (user.role !== "admin" && !(await participants(conversationId)).some((p) => p.id === user.id)) throw forbidden();
  const r = lireCreneau(raw);
  await limiter(`rdv:${user.id}`, 40, 86400, "Vous avez planifié 40 rendez-vous aujourd'hui : réessayez demain.");
  const [a] = await db.insert(schema.appels).values({ conversationId, audioSeul: r.audioSeul, creePar: user.id, prevuLe: r.debut, dureeMin: r.dureeMin, objet: r.objet, expire: fin(r.debut, r.dureeMin) }).returning();
  const lien = `/appel/${a.id}/`;
  const nature = r.audioSeul ? "Appel audio" : "Appel vidéo";
  await db.insert(schema.messages).values({ conversationId, authorId: user.id, body: `📅 ${nature} planifié${r.objet ? ` (${r.objet})` : ""} le ${quand(r.debut)}, heure de Libreville, ${r.dureeMin} min. Lien : ${lien}`, onBehalfOf: null });
  await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conversationId));
  for (const id of await aPrevenir(conversationId, user.id)) {
    await notify(id, { kind: "appel", title: `${nature} planifié le ${quand(r.debut)}`, body: `${r.objet ?? c.subject} · avec ${user.firstName}, ${r.dureeMin} min (heure de Libreville). Le lien s'ouvre 10 min avant ; ajoutez-le à votre agenda.`, link: lien, channels: ["app", "email"] });
  }
  programmerRappel(a);
  return a;
}

async function organise(user: User, id: string) {
  const [a] = await db.select().from(schema.appels).where(eq(schema.appels.id, id));
  if (!a || !a.prevuLe) throw notFound("Rendez-vous");
  if (a.creePar !== user.id && user.role !== "admin") throw forbidden();
  if (a.annuleLe) throw new AppError("Ce rendez-vous est annulé.");
  return a;
}

export async function deplacerAppel(user: User, id: string, raw: unknown) {
  const a = await organise(user, id);
  const r = lireCreneau({ audioSeul: a.audioSeul, objet: a.objet, ...(raw as object) });
  const [m] = await db.update(schema.appels).set({ prevuLe: r.debut, dureeMin: r.dureeMin, audioSeul: r.audioSeul, objet: r.objet, expire: fin(r.debut, r.dureeMin), salle: null, url: null }).where(eq(schema.appels.id, id)).returning();
  await db.insert(schema.messages).values({ conversationId: a.conversationId, authorId: user.id, body: `📅 Rendez-vous déplacé au ${quand(r.debut)}, heure de Libreville (${r.dureeMin} min). Même lien : /appel/${id}/`, onBehalfOf: null });
  for (const u of await aPrevenir(a.conversationId, user.id)) await notify(u, { kind: "appel", title: `Rendez-vous déplacé au ${quand(r.debut)}`, body: `${user.firstName} a changé l'heure du rendez-vous (heure de Libreville). Le lien ne change pas.`, link: `/appel/${id}/`, channels: ["app", "email"] });
  programmerRappel(m);
  return m;
}

export async function annulerAppel(user: User, id: string) {
  const a = await organise(user, id);
  await db.update(schema.appels).set({ annuleLe: new Date() }).where(eq(schema.appels.id, id));
  await db.insert(schema.messages).values({ conversationId: a.conversationId, authorId: user.id, body: `❌ Rendez-vous du ${quand(a.prevuLe!)} annulé.`, onBehalfOf: null });
  for (const u of await aPrevenir(a.conversationId, user.id)) await notify(u, { kind: "appel", title: `Rendez-vous du ${quand(a.prevuLe!)} annulé`, body: `${user.firstName} a annulé le rendez-vous.`, link: "/messages", channels: ["app", "email"] });
}

/** Mes rendez-vous (fils où je suis, ceux de mes enfants pour un parent, tous pour l'équipe), du plus proche au plus lointain. */
export async function mesRendezVous(user: User, opts: { passes?: boolean } = {}) {
  const A = schema.appels;
  const depuis = opts.passes ? new Date(Date.now() - 60 * 86400e3) : new Date(Date.now() - 3 * 3600e3);
  let fils: string[] | null = null;
  if (user.role !== "admin") {
    const ids = [user.id];
    if (user.role === "parent") for (const c of await childrenOf(user.id)) if (c.link.status === "actif") ids.push(c.child.id);
    fils = (await db.select({ c: schema.conversationParticipants.conversationId }).from(schema.conversationParticipants).where(inArray(schema.conversationParticipants.userId, ids))).map((x) => x.c);
    if (!fils.length) return [];
  }
  const lignes = await db.select({ a: A, sujet: schema.conversations.subject, org: { prenom: schema.users.firstName, nom: schema.users.lastName, role: schema.users.role } }).from(A)
    .innerJoin(schema.conversations, eq(schema.conversations.id, A.conversationId)).innerJoin(schema.users, eq(schema.users.id, A.creePar))
    .where(and(isNotNull(A.prevuLe), gte(A.prevuLe, depuis), fils ? inArray(A.conversationId, fils) : undefined)).orderBy(asc(A.prevuLe)).limit(200);
  const avec = new Map<string, string[]>();
  for (const c of new Set(lignes.map((l) => l.a.conversationId))) {
    avec.set(c, (await db.select({ p: schema.users.firstName, n: schema.users.lastName, r: schema.users.role }).from(schema.conversationParticipants).innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(eq(schema.conversationParticipants.conversationId, c)))
      .map((x) => `${x.p} ${x.n.charAt(0)}.`));
  }
  return lignes.map(({ a, sujet, org }) => ({
    id: a.id, conversationId: a.conversationId, sujet, objet: a.objet, prevuLe: a.prevuLe!, dureeMin: a.dureeMin ?? 30, audioSeul: a.audioSeul, annule: !!a.annuleLe,
    organisateur: `${org.prenom} ${org.nom.charAt(0)}.`, organisateurRole: org.role, monRdv: a.creePar === user.id || user.role === "admin", participants: avec.get(a.conversationId) ?? [], lien: `/appel/${a.id}/`,
  }));
}

/** Fichier agenda (.ics) d'un rendez-vous, pour l'ajouter au calendrier du téléphone (alerte 15 min avant). */
export async function agendaIcs(user: User, id: string, base: string) {
  const [a] = await db.select().from(schema.appels).where(eq(schema.appels.id, id));
  if (!a || !a.prevuLe || !(await peutRejoindre(user, a.conversationId))) throw notFound("Rendez-vous");
  const [c] = await db.select({ sujet: schema.conversations.subject }).from(schema.conversations).where(eq(schema.conversations.id, a.conversationId));
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[\\;,]/g, (x) => `\\${x}`).replace(/\n/g, "\\n");
  const lien = `${base}/appel/${a.id}/`;
  const titre = `${a.audioSeul ? "Appel audio" : "Appel vidéo"} Navigoal : ${a.objet ?? c?.sujet ?? "rendez-vous"}`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Navigoal//Rendez-vous//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${a.id}@navigoal.net`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(a.prevuLe)}`, `DTEND:${f(new Date(a.prevuLe.getTime() + (a.dureeMin ?? 30) * 60e3))}`,
    `SUMMARY:${esc(titre)}`, `DESCRIPTION:${esc(`Rejoindre : ${lien}\nLe lien s'ouvre 10 minutes avant l'heure.`)}`, `URL:${lien}`, `LOCATION:${lien}`,
    a.annuleLe ? "STATUS:CANCELLED" : "STATUS:CONFIRMED", "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", `DESCRIPTION:${esc(titre)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}

const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;

async function prevenirBientot(id: string) {
  const [a] = await db.select().from(schema.appels).where(eq(schema.appels.id, id));
  if (!a?.prevuLe || a.annuleLe || a.prevuLe.getTime() < Date.now() - 5 * 60e3) return;
  if (!(await premiereFois(`rdv15:${a.id}:${a.prevuLe.toISOString()}`))) return;
  const [c] = await db.select({ sujet: schema.conversations.subject }).from(schema.conversations).where(eq(schema.conversations.id, a.conversationId));
  for (const u of await aPrevenir(a.conversationId)) await notify(u, { kind: "appel", title: `Rendez-vous dans 15 minutes (${heure(a.prevuLe)})`, body: `${a.objet ?? c?.sujet ?? ""} · le lien est ouvert.`, link: `/appel/${a.id}/`, channels: ["app", "email"] });
}

const minuteurs = new Map<string, ReturnType<typeof setTimeout>>();
/** Rappel « dans 15 minutes » : minuteur du processus (rechargé au démarrage du serveur), un seul envoi grâce à `counters`. */
export function programmerRappel(a: { id: string; prevuLe: Date | null; annuleLe?: Date | null }) {
  const ancien = minuteurs.get(a.id); if (ancien) clearTimeout(ancien);
  if (!a.prevuLe || a.annuleLe) return;
  const dans = a.prevuLe.getTime() - 15 * 60e3 - Date.now();
  if (dans < -10 * 60e3 || dans > 20 * 86400e3) return;
  minuteurs.set(a.id, setTimeout(() => { minuteurs.delete(a.id); prevenirBientot(a.id).catch((e) => console.error("Rappel de rendez-vous :", e)); }, Math.max(0, dans)));
}

/** Au démarrage du serveur : minuteurs des rendez-vous des 20 prochains jours. */
export async function chargerRappels() {
  const futurs = await db.select({ id: schema.appels.id, prevuLe: schema.appels.prevuLe, annuleLe: schema.appels.annuleLe }).from(schema.appels)
    .where(and(isNotNull(schema.appels.prevuLe), isNull(schema.appels.annuleLe), gt(schema.appels.prevuLe, new Date(Date.now() - 10 * 60e3)), lt(schema.appels.prevuLe, new Date(Date.now() + 20 * 86400e3))));
  futurs.forEach(programmerRappel);
  return futurs.length;
}

/** Tâche quotidienne (matin) : « Rendez-vous aujourd'hui à HH:MM » à chaque participant. */
export async function rappelsDuJour(maintenant = new Date()) {
  const debut = new Date(maintenant), finJour = new Date(maintenant.getTime() + 24 * 3600e3);
  const rdv = await db.select().from(schema.appels).where(and(isNotNull(schema.appels.prevuLe), isNull(schema.appels.annuleLe), gte(schema.appels.prevuLe, debut), lt(schema.appels.prevuLe, finJour)));
  let n = 0;
  for (const a of rdv) {
    if (!(await premiereFois(`rdvjour:${a.id}:${a.prevuLe!.toISOString()}`))) continue;
    const [c] = await db.select({ sujet: schema.conversations.subject }).from(schema.conversations).where(eq(schema.conversations.id, a.conversationId));
    for (const u of await aPrevenir(a.conversationId)) { await notify(u, { kind: "appel", title: `Rendez-vous ${quand(a.prevuLe!)}`, body: `${a.objet ?? c?.sujet ?? ""} · ${a.audioSeul ? "appel audio" : "appel vidéo"}, ${a.dureeMin ?? 30} min (heure de Libreville).`, link: `/appel/${a.id}/`, channels: ["app", "email"] }); n++; }
  }
  return { rappels: n };
}

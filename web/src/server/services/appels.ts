// Appels audio ou vidéo (Daily Prebuilt) lancés depuis un fil de messagerie : entretien d'admission (école ↔ candidat),
// visite virtuelle d'un logement (bailleur ↔ locataire), rendez-vous avec un conseiller ou échange direct avec l'équipe.
// Salle privée qui expire au bout de DUREE ; on n'y entre qu'avec un jeton nominatif remis aux participants du fil,
// à l'équipe Navigoal et aux parents d'un élève du fil. Aucun enregistrement. Actif seulement si DAILY_API_KEY est défini.
import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { limiter } from "../lib/counters";
import { guardiansOf } from "./guardians";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
const DUREE_MIN = 120;
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
  if (!appelsActifs()) throw new AppError("Les appels ne sont pas encore activés.", 503, "appels_inactifs");
  if (!LANCEURS.includes(user.role)) throw forbidden();
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId));
  if (!c) throw notFound("Conversation");
  const parts = await participants(conversationId);
  if (user.role !== "admin" && !parts.some((p) => p.id === user.id)) throw forbidden();
  // Un appel encore ouvert dans ce fil est réutilisé (pas de doublon si l'on clique deux fois).
  const [enCours] = await db.select().from(schema.appels).where(and(eq(schema.appels.conversationId, conversationId), gt(schema.appels.expire, new Date(Date.now() + 15 * 60e3)))).orderBy(desc(schema.appels.createdAt)).limit(1);
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
  const base = { id: a.id, conversationId: a.conversationId, sujet: c?.sujet ?? "", audioSeul: a.audioSeul, expire: a.expire };
  if (a.expire <= new Date()) return { ...base, termine: true as const };
  if (!appelsActifs()) throw new AppError("Les appels ne sont pas encore activés.", 503, "appels_inactifs");
  const nom = user.role === "admin" ? `${user.firstName} · Navigoal` : `${user.firstName} ${user.lastName.charAt(0)}.`;
  const { token } = await daily<{ token: string }>("/meeting-tokens", {
    properties: { room_name: a.salle, user_name: nom, user_id: user.id, is_owner: user.id === a.creePar || user.role === "admin", exp: Math.floor(a.expire.getTime() / 1000), eject_at_token_exp: true, start_video_off: a.audioSeul, lang: "fr" },
  });
  return { ...base, termine: false as const, url: a.url, jeton: token };
}

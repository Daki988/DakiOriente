// Navi sur WhatsApp (API Cloud de WhatsApp Business, Meta). Meta envoie chaque message reçu au webhook
// /api/whatsapp/webhook (signature HMAC vérifiée avec WHATSAPP_APP_SECRET) ; Navi répond avec les mêmes outils et la
// même mémoire de conversation que sur le site, en texte adapté à WhatsApp (liens au lieu des cartes).
// Un numéro qui correspond au téléphone vérifié d'un compte Navigoal est reconnu (profil, candidatures).
// Réglages : WHATSAPP_TOKEN (jeton permanent d'un utilisateur système), WHATSAPP_PHONE_ID (identifiant du numéro),
// WHATSAPP_APP_SECRET (clé secrète de l'application Meta), WHATSAPP_VERIFY_TOKEN (phrase choisie, saisie aussi chez Meta).
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { and, desc, eq, gt, isNotNull, lt } from "drizzle-orm";
import { db, schema } from "../db";
import { notify } from "./notifications";
import * as navi from "./navi";
import type { Carte } from "./navi";

type User = typeof schema.users.$inferSelect;
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://navigoal.net").replace(/\/$/, "");
const VERSION = () => process.env.WHATSAPP_API_VERSION || "v21.0";
export const whatsappActif = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_APP_SECRET);

/** Vérification de l'abonnement du webhook par Meta (GET avec hub.mode, hub.verify_token, hub.challenge). */
export function verifierAbonnement(q: URLSearchParams): string | null {
  const attendu = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!attendu || q.get("hub.mode") !== "subscribe") return null;
  const recu = q.get("hub.verify_token") ?? "";
  const ok = recu.length === attendu.length && crypto.timingSafeEqual(Buffer.from(recu), Buffer.from(attendu));
  return ok ? (q.get("hub.challenge") ?? "").slice(0, 200) : null;
}

/** Signature X-Hub-Signature-256 (« sha256=… ») calculée par Meta sur le corps brut avec la clé secrète de l'application. */
export function signatureValide(brut: string, entete: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !entete?.startsWith("sha256=")) return false;
  const attendu = "sha256=" + crypto.createHmac("sha256", secret).update(brut, "utf8").digest("hex");
  return entete.length === attendu.length && crypto.timingSafeEqual(Buffer.from(entete), Buffer.from(attendu));
}

async function graph(corps: Record<string, unknown>) {
  const r = await fetch(`https://graph.facebook.com/${VERSION()}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...corps }), signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) console.error("WhatsApp :", r.status, (await r.text().catch(() => "")).slice(0, 300));
  return r.ok;
}

/** Envoie un texte (coupé en messages de 4 000 caractères au plus, la limite de WhatsApp étant 4 096). */
export async function envoyer(numero: string, texte: string) {
  const morceaux: string[] = [];
  let reste = texte.trim();
  while (reste.length > 4000) { const i = reste.lastIndexOf("\n", 4000); const c = i > 2000 ? i : 4000; morceaux.push(reste.slice(0, c)); reste = reste.slice(c).trim(); }
  if (reste) morceaux.push(reste);
  for (const m of morceaux) await graph({ to: numero, type: "text", text: { body: m, preview_url: true } });
}

/** Texte de Navi (Markdown léger) mis au format WhatsApp : gras *…*, liens écrits en clair avec l'adresse complète. */
export function versWhatsapp(md: string) {
  return md
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_, l, h) => `${l} : ${SITE()}${h}`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 : $2")
    .replace(/^#{1,4}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Les cartes du site deviennent des lignes avec liens (WhatsApp n'affiche pas de cartes cliquables). */
export function cartesEnTexte(cartes: Carte[], whatsappConseiller: boolean): string {
  const l: string[] = [];
  for (const c of cartes) {
    if (c.type === "etablissement") l.push(`• *${c.sigle}* (${c.ville})${c.parAn ? ` · ${c.parAn}` : ""} : ${SITE()}${c.href}`);
    else if (c.type === "devis") l.push(`• ${c.titre} : *${c.total}*. Devis complet : ${SITE()}${c.href}`);
    else if (c.type === "liens") for (const x of c.liens) l.push(`• ${x.libelle} : ${SITE()}${x.href}`);
    else if (c.type === "conseiller") l.push(whatsappConseiller ? "Un conseiller Navigoal a été prévenu : il te répond ici dès que possible." : "Écris « conseiller » pour parler à un membre de l'équipe Navigoal.");
    else if (c.type === "action") l.push(c.action === "candidature" ? `• Pour commencer ta candidature, connecte-toi sur le site : ${SITE()}/espace/candidatures/` : c.action === "salon" ? `• Pour t'inscrire au salon : ${SITE()}/salons/${c.salonId}/` : `• Pour demander un rendez-vous : ${SITE()}${c.suivi}`);
    else if (c.type === "suggestions" && c.suggestions.length) l.push(`Tu peux aussi me demander : ${c.suggestions.slice(0, 3).map((s) => `« ${s} »`).join(", ")}`);
  }
  return l.join("\n");
}

/** Compte Navigoal dont le téléphone vérifié correspond au numéro WhatsApp (chiffres seuls, indicatif compris). */
async function compte(numero: string): Promise<User | null> {
  const [u] = await db.select().from(schema.users).where(and(eq(schema.users.phone, `+${numero}`), isNotNull(schema.users.phoneVerifiedAt), eq(schema.users.status, "actif"))).limit(1);
  return u ?? null;
}

const DEMANDE_HUMAIN = /\b(conseill(er|ère)|humain|une personne|quelqu'un de (l'équipe|navigoal)|parler à quelqu'un)\b/i;
const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;

/** Prévient l'équipe (notification dans le back-office) qu'une personne demande un conseiller sur WhatsApp. */
async function prevenirEquipe(numero: string, nom: string | null, question: string, user: User | null) {
  if (!(await premiereFois(`wa:conseiller:${numero}:${new Date().toISOString().slice(0, 10)}`))) return; // une fois par jour et par numéro
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "admin"));
  for (const a of admins) await notify(a.id, {
    kind: "whatsapp", title: `WhatsApp : ${nom ?? (user ? `${user.firstName} ${user.lastName}` : "un visiteur")} demande un conseiller`,
    body: `+${numero} · « ${question.slice(0, 200)} »`, link: user ? `/admin/utilisateurs/${user.id}` : "/admin/navi", channels: ["app", "email"],
  });
}

export type MessageEntrant = { id: string; from: string; type: string; text?: { body?: string }; timestamp?: string };

/** Traite le corps d'une notification de Meta (déjà vérifiée) : chaque message texte reçoit une réponse de Navi. */
export async function traiterNotification(corps: unknown, opts: { client?: Anthropic } = {}) {
  const entrees = (corps as { entry?: { changes?: { value?: { messages?: MessageEntrant[]; contacts?: { wa_id?: string; profile?: { name?: string } }[] } }[] }[] })?.entry ?? [];
  for (const e of entrees) for (const ch of e.changes ?? []) {
    const v = ch.value ?? {};
    for (const m of v.messages ?? []) {
      const nom = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
      await traiterMessage(m, nom, opts).catch((err) => console.error("WhatsApp, message :", err));
    }
  }
}

export async function traiterMessage(m: MessageEntrant, nom: string | null, opts: { client?: Anthropic } = {}) {
  const numero = String(m.from ?? "").replace(/\D/g, "").slice(0, 20);
  if (!numero || !m.id) return;
  // Meta renvoie parfois la même notification : chaque message n'est traité qu'une fois.
  if (!(await premiereFois(`wa:msg:${m.id.slice(0, 120)}`))) return;
  void graph({ status: "read", message_id: m.id }).catch(() => {}); // coches bleues : « lu »
  if (m.type !== "text" || !m.text?.body?.trim()) {
    await envoyer(numero, "Je ne lis que les messages écrits pour l'instant 🙂 Écris-moi ta question, je te réponds tout de suite.");
    return;
  }
  const question = m.text.body.trim().slice(0, 2000);
  const user = await compte(numero);
  if (!navi.naviActif()) { await envoyer(numero, `Navi n'est pas disponible pour le moment. Retrouve les écoles, les formations et le devis sur ${SITE()}`); return; }
  try { await navi.verifierQuota(user, `wa:${numero}`); }
  catch (e) { await envoyer(numero, e instanceof Error ? e.message : "Limite atteinte pour aujourd'hui."); return; }

  // Fil des dernières 24 heures (au plus 24 messages), comme l'historique du widget sur le site.
  const depuis = new Date(Date.now() - 864e5);
  const fil = (await db.select({ role: schema.whatsappMessages.role, texte: schema.whatsappMessages.texte }).from(schema.whatsappMessages)
    .where(and(eq(schema.whatsappMessages.numero, numero), gt(schema.whatsappMessages.at, depuis))).orderBy(desc(schema.whatsappMessages.at)).limit(23)).reverse();
  await db.insert(schema.whatsappMessages).values({ numero, userId: user?.id ?? null, role: "user", texte: question });
  if (Math.random() < 0.02) await db.delete(schema.whatsappMessages).where(lt(schema.whatsappMessages.at, new Date(Date.now() - 90 * 864e5))).catch(() => {});

  const humain = DEMANDE_HUMAIN.test(question);
  let base = "", tour = "", erreur: string | null = null;
  const cartes: Carte[] = [];
  const messages = [...fil.map((x) => ({ role: x.role === "assistant" ? "assistant" as const : "user" as const, texte: x.texte.slice(0, 4000) })), { role: "user" as const, texte: question }];
  for await (const ev of navi.converser({ messages, page: { chemin: "/whatsapp/", titre: "WhatsApp" }, pays: user?.country ?? null }, user, { client: opts.client })) {
    if (ev.t === "etape") { if (tour.trim()) base = `${base}${base ? "\n\n" : ""}${tour.trim()}`; tour = ""; }
    else if (ev.t === "texte") tour += ev.v;
    else if (ev.t === "efface") tour = "";
    else if (ev.t === "cartes") cartes.push(...ev.v);
    else if (ev.t === "erreur") erreur = ev.v;
  }
  const texte = `${base}${base && tour.trim() ? "\n\n" : ""}${tour}`.trim();
  const conseiller = humain || cartes.some((c) => c.type === "conseiller");
  if (conseiller) await prevenirEquipe(numero, nom, question, user);
  const reponse = erreur
    ? "Navi est momentanément indisponible. Réessaie dans un instant, ou écris « conseiller » pour parler à l'équipe Navigoal."
    : [versWhatsapp(texte), cartesEnTexte(cartes, conseiller)].filter(Boolean).join("\n\n");
  if (!reponse) return;
  await envoyer(numero, reponse);
  await db.insert(schema.whatsappMessages).values({ numero, userId: user?.id ?? null, role: "assistant", texte: reponse.slice(0, 6000) });
}

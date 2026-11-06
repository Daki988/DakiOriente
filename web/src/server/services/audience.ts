// Mesure d'audience intégrée, sans cookie ni service tiers : pages vues, pays, provenance, appareils, services.
// Ni adresse IP ni identifiant persistant conservés : un visiteur est compté par une empreinte anonyme qui change chaque jour.
import { and, count, countDistinct, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { sha256 } from "../auth/tokens";
import { forbidden } from "../lib/errors";
import { paysDeIp } from "../lib/geoip";

type User = typeof schema.users.$inferSelect;
const ROBOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp\/|preview|monitor|uptime|curl|wget|python|headless|lighthouse|pingdom|semrush|ahrefs/i;
const SEL = () => process.env.AUDIENCE_SEL || process.env.DATABASE_URL || "navigoal";

export const serviceDuChemin = (p: string) => (p.startsWith("/navilease") ? "navilease" : p.startsWith("/navitravel") ? "navitravel" : "navigoal");
const appareil = (ua: string) => (/ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "tablette" : /mobi|iphone|android/i.test(ua) ? "mobile" : "ordinateur");

/** Provenance : paramètre utm_source, sinon domaine du site d'origine ; « interne » pour une navigation dans le site. */
function provenance(ref: string, utm: string | null, hote: string) {
  if (utm) return utm.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40) || "campagne";
  if (!ref) return "direct";
  let h = "";
  try { h = new URL(ref).hostname.replace(/^www\./, ""); } catch { return "direct"; }
  if (!h || h === hote.replace(/^www\./, "") || h.endsWith("navigoal.net") || h === "localhost") return "interne";
  if (/google\./.test(h)) return "google";
  if (/bing\.|duckduckgo|yahoo\.|ecosia|qwant/.test(h)) return "autres moteurs";
  if (/facebook|fb\.|messenger/.test(h)) return "facebook";
  if (/instagram/.test(h)) return "instagram";
  if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
  if (/tiktok/.test(h)) return "tiktok";
  if (/youtube|youtu\.be/.test(h)) return "youtube";
  if (/linkedin|lnkd/.test(h)) return "linkedin";
  if (/t\.co$|twitter|x\.com/.test(h)) return "x";
  return h.slice(0, 60);
}

export async function enregistrer(req: Request, b: { p?: unknown; r?: unknown; u?: unknown }, connecte: boolean) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || ROBOTS.test(ua)) return;
  const p = typeof b.p === "string" ? b.p.split("?")[0].split("#")[0].slice(0, 200) : "";
  if (!/^\/[\w\-./%]*$/.test(p) || p.startsWith("/api/") || p.startsWith("/admin")) return;
  const chemin = p.length > 1 && !p.endsWith("/") ? `${p}/` : p;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const day = new Date().toISOString().slice(0, 10);
  const hote = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  await db.insert(schema.pageViews).values({
    day, path: chemin, service: serviceDuChemin(chemin), country: paysDeIp(ip), connected: connecte,
    source: provenance(typeof b.r === "string" ? b.r.slice(0, 500) : "", typeof b.u === "string" && b.u ? b.u : null, hote),
    device: appareil(ua), visitor: sha256(`${day}|${ip}|${ua}|${SEL()}`).slice(0, 20),
  });
  // Conservation : 13 mois de détail.
  if (Math.random() < 0.002) await db.delete(schema.pageViews).where(lt(schema.pageViews.at, new Date(Date.now() - 396 * 864e5)));
}

const PERIODES: Record<string, number> = { jour: 1, "7j": 7, "30j": 30, "12m": 365 };

export async function statistiques(admin: User, q: { periode?: string | null; service?: string | null; pays?: string | null }) {
  if (admin.role !== "admin") throw forbidden();
  const jours = PERIODES[q.periode ?? "30j"] ?? 30;
  const debut = new Date(); debut.setUTCHours(0, 0, 0, 0); debut.setUTCDate(debut.getUTCDate() - (jours - 1));
  const precedent = new Date(debut.getTime() - jours * 864e5);
  const pv = schema.pageViews;
  const filtres = (depuis: Date, jusqua?: Date) => and(gte(pv.at, depuis), jusqua ? lt(pv.at, jusqua) : undefined,
    q.service && q.service !== "tous" ? eq(pv.service, q.service) : undefined, q.pays && q.pays !== "tous" ? eq(pv.country, q.pays) : undefined);
  const w = filtres(debut), wPrec = filtres(precedent, debut);
  const visiteursUniques = sql<number>`count(distinct ${pv.visitor} || ${pv.day})`;
  const [[tot], [prec], parJour, pays, pages, sources, appareils, services, [enLigne], [inscrits]] = await Promise.all([
    db.select({ vues: count(), visiteurs: visiteursUniques }).from(pv).where(w),
    db.select({ vues: count(), visiteurs: visiteursUniques }).from(pv).where(wPrec),
    db.select({ jour: pv.day, vues: count(), visiteurs: countDistinct(pv.visitor) }).from(pv).where(w).groupBy(pv.day).orderBy(pv.day),
    db.select({ code: pv.country, visiteurs: visiteursUniques }).from(pv).where(w).groupBy(pv.country).orderBy(desc(visiteursUniques)).limit(12),
    db.select({ chemin: pv.path, vues: count() }).from(pv).where(w).groupBy(pv.path).orderBy(desc(count())).limit(12),
    db.select({ source: pv.source, n: count() }).from(pv).where(and(w, sql`${pv.source} <> 'interne'`)).groupBy(pv.source).orderBy(desc(count())).limit(8),
    db.select({ appareil: pv.device, visiteurs: visiteursUniques }).from(pv).where(w).groupBy(pv.device),
    db.select({ service: pv.service, vues: count() }).from(pv).where(w).groupBy(pv.service),
    db.select({ n: countDistinct(pv.visitor) }).from(pv).where(and(gte(pv.at, new Date(Date.now() - 5 * 60e3)))),
    db.select({ n: count() }).from(schema.users).where(gte(schema.users.createdAt, debut)),
  ]);
  const v = Number(tot.visiteurs), vues = Number(tot.vues);
  return {
    periode: q.periode ?? "30j", depuis: debut.toISOString().slice(0, 10),
    kpi: { visiteurs: v, vues, pagesParVisite: v ? Math.round((vues / v) * 10) / 10 : 0, inscriptions: Number(inscrits.n), enLigne: Number(enLigne.n),
      evolution: { visiteurs: Number(prec.visiteurs) ? Math.round(((v - Number(prec.visiteurs)) / Number(prec.visiteurs)) * 100) : null, vues: Number(prec.vues) ? Math.round(((vues - Number(prec.vues)) / Number(prec.vues)) * 100) : null } },
    parJour: parJour.map((x) => ({ jour: x.jour, vues: Number(x.vues), visiteurs: Number(x.visiteurs) })),
    pays: pays.map((x) => ({ code: x.code, visiteurs: Number(x.visiteurs) })),
    pages: pages.map((x) => ({ chemin: x.chemin, vues: Number(x.vues) })),
    sources: sources.map((x) => ({ source: x.source, n: Number(x.n) })),
    appareils: appareils.map((x) => ({ appareil: x.appareil, visiteurs: Number(x.visiteurs) })),
    services: services.map((x) => ({ service: x.service, vues: Number(x.vues) })),
  };
}

export function csv(s: Awaited<ReturnType<typeof statistiques>>) {
  return ["Jour;Visiteurs;Pages vues", ...s.parJour.map((x) => `${x.jour};${x.visiteurs};${x.vues}`), "", "Pays;Visiteurs", ...s.pays.map((x) => `${x.code ?? "inconnu"};${x.visiteurs}`), "", "Page;Vues", ...s.pages.map((x) => `${x.chemin};${x.vues}`), "", "Provenance;Entrées", ...s.sources.map((x) => `${x.source};${x.n}`)].join("\n");
}

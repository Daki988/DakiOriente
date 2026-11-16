// Accès réservé à certains pays (réglage du back-office) : visiteurs, élèves et parents ne peuvent utiliser
// Navigoal que depuis les pays choisis. Les comptes professionnels (écoles, bailleurs, conseillers, administrateurs)
// et les robots des moteurs de recherche passent partout.
// Le contrôle a lieu devant Next.js, à chaque requête (deploiement/app.js → outils/acces.mjs), car la plupart des
// pages sont pré-générées et ne repassent pas par le code de l'application.
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { sha256 } from "../auth/tokens";
import { audit } from "../lib/audit";
import { AppError, forbidden } from "../lib/errors";
import { paysDeIp } from "../lib/geoip";

type User = typeof schema.users.$inferSelect;
export type ReglageAcces = { actif: boolean; pays: string[] };

const CLE = "acces_pays";
export const DEFAUT: ReglageAcces = { actif: false, pays: ["GA", "CI"] };
export const PAGE_BLOCAGE = "/acces-restreint/";
const ROLES_PARTOUT = new Set(["etablissement", "bailleur", "conseiller", "admin"]);

// Moteurs de recherche et aperçus de liens : les pages publiques restent référencées.
const ROBOTS = /googlebot|google-inspectiontool|bingbot|duckduckbot|yandex(bot)?|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i;

// Toujours accessibles : fichiers (page de blocage comprise), connexion des comptes pros, surveillance, retours de paiement.
const LIBRES = [
  /^\/_next\//, /^\/(images|logos|photos|brand|fiches)\//, /^\/[^/]+\.[a-z0-9]{2,5}$/i, // fichiers statiques
  /^\/acces-restreint\/?$/, /^\/(cgu|confidentialite|mentions-legales|cookies)\/?$/,
  /^\/(connexion|premiere-connexion|mot-de-passe-oublie)\/?$/,
  /^\/api\/(sante|paiements\/webhook\/[^/]+|auth\/.*|acces\/statut)\/?$/,
];

let cache: { at: number; r: ReglageAcces } | null = null;
export async function reglage(): Promise<ReglageAcces> {
  if (cache && Date.now() - cache.at < 30_000) return cache.r;
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, CLE));
  const v = (row?.value ?? {}) as Partial<ReglageAcces>;
  const r = { actif: v.actif ?? DEFAUT.actif, pays: Array.isArray(v.pays) && v.pays.length ? v.pays : DEFAUT.pays };
  cache = { at: Date.now(), r };
  return r;
}

const schemaReglage = z.object({
  actif: z.boolean(),
  pays: z.array(z.string().regex(/^[A-Z]{2}$/, "Code pays ISO à 2 lettres")).min(1, "Choisissez au moins un pays.").max(60),
});

export async function vueAdmin(admin: User) {
  if (admin.role !== "admin") throw forbidden();
  return reglage();
}

export async function enregistrer(admin: User, body: unknown) {
  if (admin.role !== "admin") throw forbidden();
  const r = schemaReglage.parse(body);
  r.pays = [...new Set(r.pays)];
  await db.insert(schema.appSettings).values({ key: CLE, value: r, updatedBy: admin.id })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: r, updatedBy: admin.id, updatedAt: new Date() } });
  cache = { at: Date.now(), r };
  await audit(admin.id, "acces_pays", "reglage", CLE, r);
  // Pages gardées par le cache de l'hébergeur : vidées pour que le nouveau réglage s'applique tout de suite.
  const site = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (site && process.env.NODE_ENV === "production") await fetch(`${site}/.*`, { method: "PURGE" }).catch(() => {});
  return r;
}

/** Rôle du compte connecté (cookie de session), sans passer par Next.js. */
async function roleDeSession(jeton: string | null) {
  if (!jeton) return null;
  const [s] = await db.select({ role: schema.users.role, status: schema.users.status }).from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(jeton)), gt(schema.sessions.expiresAt, new Date()))).limit(1);
  return s && s.status !== "suspendu" ? s.role : null;
}

export const cheminLibre = (chemin: string) => LIBRES.some((re) => re.test(chemin));

export type Demande = { chemin: string; ip: string; agent: string; jeton: string | null };
export type Decision = { actif: boolean; autorise: boolean; pays: string | null; motif: string };

export async function decider(d: Demande): Promise<Decision> {
  const r = await reglage();
  const pays = d.ip ? paysDeIp(d.ip) : null;
  if (!r.actif) return { actif: false, autorise: true, pays, motif: "inactif" };
  if (cheminLibre(d.chemin)) return { actif: true, autorise: true, pays, motif: "libre" };
  if (!d.ip) return { actif: true, autorise: true, pays, motif: "ip_inconnue" }; // appel interne (pas de relais)
  if (pays && r.pays.includes(pays)) return { actif: true, autorise: true, pays, motif: "pays" };
  if (ROBOTS.test(d.agent)) return { actif: true, autorise: true, pays, motif: "robot" };
  const role = await roleDeSession(d.jeton);
  if (role && ROLES_PARTOUT.has(role)) return { actif: true, autorise: true, pays, motif: "compte_pro" };
  return { actif: true, autorise: false, pays, motif: "pays_hors_liste" };
}

/** Message de l'API pour une requête refusée. */
export const refus = () => new AppError("Navigoal n'est pas disponible dans votre pays.", 403, "pays_non_autorise");

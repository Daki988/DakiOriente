// Connexion avec Google (OpenID Connect, flux « authorization code »).
// Configuration : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ; URI de redirection autorisée dans la console Google :
// https://<domaine>/api/auth/google/retour/
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError } from "../lib/errors";
import { sendEmail } from "../lib/messaging-channels";
import { randomToken } from "../auth/tokens";
import { normEmail } from "./accounts";

export const GOOGLE_ROLES = ["eleve", "etudiant", "parent", "bailleur"] as const;
export type GoogleRole = (typeof GOOGLE_ROLES)[number];
/** Page où compléter le profil après une inscription avec Google. */
export const PROFIL_A_COMPLETER: Record<GoogleRole, string> = { eleve: "/espace/profil/", etudiant: "/espace/profil/", parent: "/compte/", bailleur: "/bailleur/profil/" };
export const googleActif = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Adresse publique du site (variables d'environnement, sinon en-têtes du proxy). */
export function baseUrl(req: Request) {
  const env = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.URL;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? new URL(req.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}
export const redirectUri = (req: Request) => `${baseUrl(req)}/api/auth/google/retour/`;

export function authorizeUrl(req: Request, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri(req), response_type: "code",
    scope: "openid email profile", state, prompt: "select_account", access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
export const nouvelEtat = () => randomToken();

type Profil = { email: string; given_name?: string; family_name?: string; name?: string; email_verified?: boolean };

/** Échange le code contre un jeton puis lit le profil Google (adresse vérifiée obligatoire). */
export async function profilGoogle(req: Request, code: string): Promise<Profil> {
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri(req), grant_type: "authorization_code" }),
  });
  if (!t.ok) throw new AppError("Google n'a pas validé la connexion. Réessayez.", 400, "google");
  const { access_token } = (await t.json()) as { access_token?: string };
  const p = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!p.ok) throw new AppError("Profil Google indisponible. Réessayez.", 400, "google");
  const profil = (await p.json()) as Profil;
  if (!profil.email || profil.email_verified === false) throw new AppError("Votre adresse Google n'est pas vérifiée.", 400, "google");
  return profil;
}

/** Compte existant (même e-mail) ou nouveau compte si un profil a été choisi à l'inscription. */
export async function compteGoogle(p: Profil, role: GoogleRole | null) {
  const email = normEmail(p.email);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (u) {
    if (u.status === "suspendu") throw new AppError("Ce compte est suspendu. Contactez contact@navigoal.net.", 403, "suspendu");
    if (!u.emailVerifiedAt) await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, u.id));
    await audit(u.id, "connexion_google", "user", u.id);
    return { user: u, nouveau: false };
  }
  if (!role) return { user: null, nouveau: false };
  const firstName = (p.given_name || p.name?.split(" ")[0] || email.split("@")[0]).slice(0, 80);
  const lastName = (p.family_name || p.name?.split(" ").slice(1).join(" ") || "—").slice(0, 80);
  const user = await db.transaction(async (tx) => {
    const [n] = await tx.insert(schema.users).values({ role, firstName, lastName, email, passwordHash: null, emailVerifiedAt: new Date(), status: "actif" }).returning();
    await tx.insert(schema.profiles).values({ userId: n.id });
    if (role === "bailleur") await tx.insert(schema.landlords).values({ userId: n.id, kind: "particulier" });
    return n;
  });
  await audit(user.id, "inscription", "user", user.id, { role, via: "google" });
  await sendEmail({
    to: email, subject: "Bienvenue sur Navigoal", titre: `Bienvenue ${firstName} !`,
    text: "Votre compte Navigoal est créé avec votre compte Google : vous vous connectez désormais en un clic, sans mot de passe. Complétez votre profil (pays d'origine, niveau) pour des montants convertis dans votre monnaie et des recommandations adaptées.",
    action: { label: "Compléter mon profil", url: PROFIL_A_COMPLETER[role] },
  }).catch(() => {});
  return { user, nouveau: true };
}

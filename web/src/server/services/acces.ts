// Accès des établissements : un compte par école, créé par Navigoal avec un mot de passe provisoire
// (jamais conservé en clair) à remplacer à la première connexion.
import { randomInt } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { hashPassword, passwordProblem } from "../auth/password";
import { AppError, forbidden, notFound } from "../lib/errors";
import { sendEmail } from "../lib/messaging-channels";
import { etabById } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

type User = typeof schema.users.$inferSelect;
const assertAdmin = (u: User) => { if (u.role !== "admin") throw forbidden(); };
/** Domaine des identifiants provisoires quand l'école ne publie pas d'e-mail (à remplacer par l'admin). */
export const DOMAINE_PROVISOIRE = "acces.navigoal.net";
export const estProvisoire = (email: string | null) => !!email && email.endsWith(`@${DOMAINE_PROVISOIRE}`);

/** Mot de passe provisoire lisible : 3 groupes sans caractères ambigus (ex. « Kf7m-Q2xp-9Rtw »). */
export function motDePasseProvisoire() {
  const A = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    const g = () => Array.from({ length: 4 }, () => A[randomInt(A.length)]).join("");
    const p = `${g()}-${g()}-${g()}`;
    if (!passwordProblem(p)) return p;
  }
}

/** E-mail officiel publié par l'école (site, rubrique contact), s'il existe. */
const emailOfficiel = (eid: string) => {
  const c = (etabById[eid]?.site as { contact?: { email?: string } } | null)?.contact?.email?.trim().toLowerCase();
  return c && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(c) ? c : null;
};

export type AccesCree = { etablissement: string; sigle: string; nom: string; email: string; motDePasse: string; provisoire: boolean };

async function creerCompte(e: typeof schema.establishments.$inferSelect, email: string | null, nom?: { firstName: string; lastName: string }): Promise<AccesCree> {
  let login = email?.toLowerCase() ?? null;
  if (login && (await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, login))).length) login = null;
  if (!login) {
    login = `${e.id.replace(/^ma-/, "")}@${DOMAINE_PROVISOIRE}`;
    for (let k = 2; (await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, login))).length; k++) login = `${e.id.replace(/^ma-/, "")}-${k}@${DOMAINE_PROVISOIRE}`;
  }
  const mdp = motDePasseProvisoire();
  const [u] = await db.insert(schema.users).values({ role: "etablissement", status: "actif", email: login, firstName: nom?.firstName ?? e.sigle, lastName: nom?.lastName ?? "Admissions", country: "MA", city: e.ville, passwordHash: await hashPassword(mdp), mustChangePassword: true }).returning();
  await db.insert(schema.establishmentMembers).values({ userId: u.id, establishmentId: e.id, role: "admin_ecole" }).onConflictDoNothing();
  return { etablissement: e.id, sigle: e.sigle, nom: e.nom, email: login, motDePasse: mdp, provisoire: estProvisoire(login) };
}

/** Crée l'accès des écoles qui n'ont encore aucun compte actif. Les mots de passe ne sont rendus qu'ici, une seule fois. */
export async function createMissingAccesses(actor: User | null) {
  if (actor) assertAdmin(actor);
  const sans = await db.select().from(schema.establishments)
    .where(sql`${schema.establishments.status} <> 'suspendu' and not exists (select 1 from establishment_members m join users u on u.id = m.user_id where m.establishment_id = ${schema.establishments.id} and u.status = 'actif')`)
    .orderBy(schema.establishments.sigle);
  const crees: AccesCree[] = [];
  for (const e of sans) crees.push(await creerCompte(e, emailOfficiel(e.id) ?? e.email));
  await audit(actor?.id ?? null, "acces_ecoles_crees", "establishment", null, { n: crees.length });
  return crees;
}

export const collaborateurSchema = z.object({ email: z.string().trim().toLowerCase().email("E-mail invalide."), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80) });

export async function addCollaborator(admin: User, establishmentId: string, raw: z.input<typeof collaborateurSchema>) {
  assertAdmin(admin);
  const i = collaborateurSchema.parse(raw);
  const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, establishmentId));
  if (!e) throw notFound("Établissement");
  if ((await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, i.email))).length) throw new AppError("Un compte existe déjà avec cet e-mail.", 409, "doublon");
  const r = await creerCompte(e, i.email, i);
  await audit(admin.id, "acces_collaborateur", "establishment", establishmentId, { email: i.email });
  return r;
}

async function compteEcole(userId: string) {
  const [r] = await db.select({ u: schema.users, e: schema.establishments }).from(schema.users)
    .innerJoin(schema.establishmentMembers, eq(schema.establishmentMembers.userId, schema.users.id)).innerJoin(schema.establishments, eq(schema.establishments.id, schema.establishmentMembers.establishmentId))
    .where(and(eq(schema.users.id, userId), eq(schema.users.role, "etablissement"))).limit(1);
  if (!r) throw notFound("Accès");
  return r;
}

/** Nouveau mot de passe provisoire (affiché une fois), les sessions ouvertes sont fermées. */
export async function resetAccess(admin: User, userId: string) {
  assertAdmin(admin);
  const { u, e } = await compteEcole(userId);
  const mdp = motDePasseProvisoire();
  await db.update(schema.users).set({ passwordHash: await hashPassword(mdp), mustChangePassword: true, status: u.status === "suspendu" ? u.status : "actif" }).where(eq(schema.users.id, u.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
  await audit(admin.id, "acces_reinitialise", "user", u.id);
  return { etablissement: e.id, sigle: e.sigle, nom: e.nom, email: u.email!, motDePasse: mdp, provisoire: estProvisoire(u.email) } satisfies AccesCree;
}

/** Envoie l'accès par e-mail à l'adresse officielle de l'école (nouveau mot de passe provisoire). */
export async function sendAccess(admin: User, userId: string) {
  const a = await resetAccess(admin, userId);
  if (a.provisoire) throw new AppError("Adresse provisoire : renseignez d'abord l'e-mail officiel de l'école.", 400, "email_provisoire");
  await sendEmail({
    to: a.email, subject: "Navigoal · Votre accès établissement", titre: `Votre espace ${a.sigle} sur Navigoal`,
    text: `Bonjour,\n\nNavigoal accompagne les élèves d'Afrique qui veulent étudier au Maroc. ${a.nom} y dispose d'un espace établissement pour recevoir et traiter ses candidatures, gratuitement.\n\nIdentifiant : ${a.email}\nMot de passe provisoire : ${a.motDePasse}\n\nÀ la première connexion, vous choisirez votre mot de passe personnel. Un guide de la plateforme vous attend ensuite dans votre espace.\n\nL'équipe Navigoal · contact@navigoal.net`,
    action: { label: "Me connecter", url: `${SITE_URL}/connexion/` },
  });
  await audit(admin.id, "acces_envoye", "user", userId);
  return { envoye: a.email };
}

/** Envoie tous les accès jamais utilisés (adresse officielle connue). */
export async function sendUnusedAccesses(admin: User) {
  assertAdmin(admin);
  const r = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users)
    .where(and(eq(schema.users.role, "etablissement"), eq(schema.users.mustChangePassword, true), sql`${schema.users.lastLoginAt} is null`, eq(schema.users.status, "actif")));
  let envoyes = 0;
  for (const x of r) if (!estProvisoire(x.email)) { await sendAccess(admin, x.id); envoyes++; }
  return { envoyes, ignores: r.length - envoyes };
}

export async function updateAccessEmail(admin: User, userId: string, email: string) {
  assertAdmin(admin);
  const e = z.string().trim().toLowerCase().email("E-mail invalide.").parse(email);
  await compteEcole(userId);
  if ((await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.email, e), sql`${schema.users.id} <> ${userId}`))).length) throw new AppError("Un compte existe déjà avec cet e-mail.", 409, "doublon");
  await db.update(schema.users).set({ email: e, emailVerifiedAt: null }).where(eq(schema.users.id, userId));
  await audit(admin.id, "acces_email_modifie", "user", userId, { email: e });
}

export async function listAccesses(admin: User) {
  assertAdmin(admin);
  const ecoles = await db.select({ id: schema.establishments.id, sigle: schema.establishments.sigle, nom: schema.establishments.nom, ville: schema.establishments.ville, logo: schema.establishments.logo }).from(schema.establishments).orderBy(schema.establishments.sigle);
  const comptes = await db.select({ eid: schema.establishmentMembers.establishmentId, id: schema.users.id, email: schema.users.email, firstName: schema.users.firstName, lastName: schema.users.lastName, status: schema.users.status, lastLoginAt: schema.users.lastLoginAt, mustChangePassword: schema.users.mustChangePassword, createdAt: schema.users.createdAt })
    .from(schema.establishmentMembers).innerJoin(schema.users, eq(schema.users.id, schema.establishmentMembers.userId)).where(inArray(schema.establishmentMembers.establishmentId, ecoles.map((e) => e.id)));
  const items = ecoles.map((e) => ({ ...e, comptes: comptes.filter((c) => c.eid === e.id).map((c) => ({ ...c, provisoire: estProvisoire(c.email), etat: c.status !== "actif" ? c.status : c.lastLoginAt && !c.mustChangePassword ? "actif" : "jamais_connecte" })) }));
  const tous = items.flatMap((e) => e.comptes);
  return {
    items,
    stats: { ecoles: ecoles.length, avecAcces: items.filter((e) => e.comptes.some((c) => c.status === "actif")).length, connectees: items.filter((e) => e.comptes.some((c) => c.etat === "actif")).length,
      jamais: items.filter((e) => e.comptes.length && e.comptes.every((c) => c.etat === "jamais_connecte")).length, emailACompleter: tous.filter((c) => c.provisoire).length },
  };
}

/** Première connexion : choix du mot de passe personnel (sans redemander le provisoire, la session vient d'être ouverte avec). */
export async function firstPassword(user: User, next: string) {
  if (!user.mustChangePassword) throw new AppError("Utilisez « Changer de mot de passe » dans votre compte.", 400, "deja_change");
  const pb = passwordProblem(String(next ?? ""));
  if (pb) throw new AppError(pb);
  await db.update(schema.users).set({ passwordHash: await hashPassword(next), mustChangePassword: false }).where(eq(schema.users.id, user.id));
  await audit(user.id, "premier_mot_de_passe", "user", user.id);
}

/** CSV des accès créés (identifiants et mots de passe provisoires) : à transmettre aux écoles, puis à supprimer. */
export function accesCsv(rows: AccesCree[]) {
  const esc = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  return ["Établissement;Sigle;Identifiant;Mot de passe provisoire;Adresse à compléter", ...rows.map((r) => [r.nom, r.sigle, r.email, r.motDePasse, r.provisoire ? "oui" : "non"].map(esc).join(";"))].join("\n");
}

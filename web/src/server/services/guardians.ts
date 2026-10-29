import { and, eq, gt, or, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden } from "../lib/errors";
import { otpCode } from "../auth/tokens";
import { isMinor, normEmail, normPhone } from "./accounts";
import { notify } from "./notifications";
import { sendEmail, sendSms } from "../lib/messaging-channels";
import { audit } from "../lib/audit";

type User = typeof schema.users.$inferSelect;

/** L'élève/étudiant invite son parent ou tuteur (e-mail ou téléphone). */
export async function inviteGuardian(child: User, contact: string, relation = "parent") {
  if (!["eleve", "etudiant"].includes(child.role)) throw forbidden();
  contact = String(contact ?? "").trim();
  const isEmail = contact.includes("@");
  if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : !/^\+?[0-9 ]{8,16}$/.test(contact) || !normPhone(contact).startsWith("+"))
    throw new AppError("Indiquez l'e-mail ou le numéro du parent (avec l'indicatif du pays, ex. +241).");
  // Anti-abus (envois d'e-mails ou de SMS en masse) : 5 invitations par jour au plus.
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.guardianships)
    .where(and(eq(schema.guardianships.childId, child.id), gt(schema.guardianships.createdAt, new Date(Date.now() - 864e5))));
  if (n >= 5) throw new AppError("Trop d'invitations envoyées aujourd'hui. Réessaie demain.", 429, "trop_de_tentatives");
  const code = otpCode();
  const [g] = await db.insert(schema.guardianships).values({ childId: child.id, inviteEmail: isEmail ? normEmail(contact) : null, invitePhone: isEmail ? null : normPhone(contact), inviteCode: code, relation }).returning();
  const text = `${child.firstName} ${child.lastName} vous invite à suivre son parcours sur Navigoal. Code d'invitation : ${code}. Créez votre compte parent puis saisissez ce code.`;
  if (isEmail) await sendEmail({ to: normEmail(contact), subject: "Invitation à suivre un parcours Navigoal", titre: `${child.firstName} vous invite sur Navigoal`, code, text, action: { label: "Créer mon compte parent", url: "/inscription/?role=parent" } });
  else await sendSms({ to: normPhone(contact), text });
  return g;
}

/** Le parent saisit le code reçu : le lien est actif et le consentement parental enregistré. */
export async function acceptGuardianInvite(parent: User, code: string, consent: boolean) {
  if (parent.role !== "parent") throw forbidden();
  // Anti force brute : 10 codes erronés par heure et par compte parent.
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.action, "invitation_echec"), eq(schema.auditLogs.actorId, parent.id), gt(schema.auditLogs.createdAt, new Date(Date.now() - 3600e3))));
  if (n >= 10) throw new AppError("Trop de codes erronés. Réessayez dans une heure.", 429, "trop_de_tentatives");
  // Le code n'est valable que pour le parent invité : son e-mail ou son téléphone doit être celui de l'invitation.
  const cibles = [parent.email ? eq(schema.guardianships.inviteEmail, parent.email) : undefined, parent.phone ? eq(schema.guardianships.invitePhone, parent.phone) : undefined].filter(Boolean);
  const [g] = cibles.length ? await db.select().from(schema.guardianships)
    .where(and(eq(schema.guardianships.inviteCode, String(code ?? "").trim()), eq(schema.guardianships.status, "invite"), or(...cibles))).limit(1) : [];
  if (!g) {
    await audit(parent.id, "invitation_echec", "guardianship", null);
    throw new AppError("Code invalide, déjà utilisé, ou envoyé à un autre e-mail ou téléphone que celui de votre compte.");
  }
  await db.update(schema.guardianships).set({ parentId: parent.id, status: "actif", consentAt: consent ? new Date() : null, inviteCode: null }).where(eq(schema.guardianships.id, g.id));
  await notify(g.childId, { kind: "parent_lie", title: `${parent.firstName} ${parent.lastName} suit désormais ton parcours`, link: "/espace" });
  return g.childId;
}

export async function setConsent(parent: User, childId: string, consent: boolean) {
  const r = await db.update(schema.guardianships).set({ consentAt: consent ? new Date() : null })
    .where(and(eq(schema.guardianships.parentId, parent.id), eq(schema.guardianships.childId, childId), eq(schema.guardianships.status, "actif"))).returning();
  if (!r.length) throw forbidden();
}

export async function childrenOf(parentId: string) {
  return db.select({ link: schema.guardianships, child: schema.users }).from(schema.guardianships)
    .innerJoin(schema.users, eq(schema.users.id, schema.guardianships.childId))
    .where(and(eq(schema.guardianships.parentId, parentId), eq(schema.guardianships.status, "actif")));
}

export async function guardiansOf(childId: string) {
  // Colonnes choisies : jamais le mot de passe, le secret TOTP ni les données internes du parent.
  const parent = { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, email: schema.users.email, phone: schema.users.phone };
  return db.select({ link: schema.guardianships, parent }).from(schema.guardianships)
    .leftJoin(schema.users, eq(schema.users.id, schema.guardianships.parentId))
    .where(eq(schema.guardianships.childId, childId));
}

export async function isGuardianOf(parentId: string, childId: string) {
  const r = await db.select({ id: schema.guardianships.id }).from(schema.guardianships)
    .where(and(eq(schema.guardianships.parentId, parentId), eq(schema.guardianships.childId, childId), eq(schema.guardianships.status, "actif"))).limit(1);
  return r.length > 0;
}

/** Fonctionnalités sensibles (candidature, paiement, réservation) : consentement requis pour les mineurs. */
export async function assertConsentIfMinor(user: User) {
  if (!isMinor(user.birthYear)) return;
  const r = await db.select({ c: schema.guardianships.consentAt }).from(schema.guardianships)
    .where(and(eq(schema.guardianships.childId, user.id), eq(schema.guardianships.status, "actif"))).limit(5);
  if (!r.some((x) => x.c)) throw new AppError("Le consentement d'un parent ou tuteur est nécessaire avant cette étape. Invitez-le depuis ton profil.", 403, "consentement_requis");
}

export const guardianLinkFilter = (userId: string) => or(eq(schema.guardianships.parentId, userId), eq(schema.guardianships.childId, userId));

import { and, eq, or } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden } from "../lib/errors";
import { otpCode } from "../auth/tokens";
import { isMinor, normEmail, normPhone } from "./accounts";
import { notify } from "./notifications";
import { sendEmail, sendSms } from "../lib/messaging-channels";

type User = typeof schema.users.$inferSelect;

/** L'élève/étudiant invite son parent ou tuteur (e-mail ou téléphone). */
export async function inviteGuardian(child: User, contact: string, relation = "parent") {
  if (!["eleve", "etudiant"].includes(child.role)) throw forbidden();
  const isEmail = contact.includes("@");
  const code = otpCode();
  const [g] = await db.insert(schema.guardianships).values({ childId: child.id, inviteEmail: isEmail ? normEmail(contact) : null, invitePhone: isEmail ? null : normPhone(contact), inviteCode: code, relation }).returning();
  const text = `${child.firstName} ${child.lastName} vous invite à suivre son parcours sur Navigoal. Code d'invitation : ${code}. Créez votre compte parent puis saisissez ce code.`;
  if (isEmail) await sendEmail({ to: normEmail(contact), subject: "Invitation à suivre un parcours Navigoal", text });
  else await sendSms({ to: normPhone(contact), text });
  return g;
}

/** Le parent saisit le code reçu : le lien est actif et le consentement parental enregistré. */
export async function acceptGuardianInvite(parent: User, code: string, consent: boolean) {
  if (parent.role !== "parent") throw forbidden();
  const [g] = await db.select().from(schema.guardianships).where(and(eq(schema.guardianships.inviteCode, code.trim()), eq(schema.guardianships.status, "invite"))).limit(1);
  if (!g) throw new AppError("Code d'invitation invalide ou déjà utilisé.");
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
  return db.select({ link: schema.guardianships, parent: schema.users }).from(schema.guardianships)
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

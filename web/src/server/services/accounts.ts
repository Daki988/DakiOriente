import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError } from "../lib/errors";
import { sendEmail, sendSms } from "../lib/messaging-channels";
import { hashPassword, passwordProblem, verifyPassword } from "../auth/password";
import { otpCode, sha256 } from "../auth/tokens";
import { isCountryCode } from "@/lib/pays-origine";

export const PUBLIC_ROLES = ["eleve", "etudiant", "parent", "etablissement", "bailleur"] as const;
const phoneRe = /^\+?[0-9 ]{8,16}$/;
export const normPhone = (p: string) => p.replace(/[^\d+]/g, "").replace(/^00/, "+");
const isEmail = (s: string) => s.includes("@");
/** Identifiant normalisé (e-mail en minuscules, téléphone au format international). */
export const normId = (s: string) => (isEmail(s) ? normEmail(s) : normPhone(s));
export const normEmail = (e: string) => e.trim().toLowerCase();

export const registerSchema = z.object({
  role: z.enum(PUBLIC_ROLES, { message: "Choisissez votre profil (élève, étudiant, parent, établissement ou bailleur)." }),
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  phone: z.string().trim().regex(phoneRe, "Numéro de téléphone invalide : indiquez-le avec l'indicatif du pays (ex. +212 6 12 34 56 78).").optional().or(z.literal("")),
  password: z.string({ message: "Mot de passe requis." }),
  birthYear: z.coerce.number({ message: "Année de naissance invalide." }).int().min(1940, "Année de naissance invalide.").max(new Date().getFullYear() - 8, "Année de naissance invalide.").optional(),
  country: z.string().trim().toUpperCase().refine(isCountryCode, "Pays inconnu.").optional(),
  city: z.string().trim().max(80).optional(),
  level: z.string().optional(),
  serie: z.string().optional(),
  currentSchool: z.string().max(160).optional(),
  establishmentId: z.string().optional(), // compte établissement : école revendiquée
  company: z.string().max(160).optional(), // bailleur : société / résidence
  guardianEmail: z.string().trim().email("E-mail du parent invalide.").optional().or(z.literal("")),
  guardianPhone: z.string().trim().regex(phoneRe, "Numéro du parent invalide (avec l'indicatif du pays).").optional().or(z.literal("")),
  acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions d'utilisation." }),
});
export type RegisterInput = z.input<typeof registerSchema>;

export const isMinor = (birthYear?: number | null) => !!birthYear && new Date().getFullYear() - birthYear < 18;

export async function register(raw: RegisterInput) {
  const input = registerSchema.parse(raw);
  const email = input.email ? normEmail(input.email) : null;
  const phone = input.phone ? normPhone(input.phone) : null;
  if (!email && !phone) throw new AppError("Indiquez un e-mail ou un numéro de téléphone.");
  if (phone && !phone.startsWith("+")) throw new AppError("Indiquez le numéro avec l'indicatif du pays (ex. +212, +221, +225).");
  if ((input.role === "eleve" || input.role === "etudiant") && isMinor(input.birthYear) && !input.guardianEmail && !input.guardianPhone)
    throw new AppError("Tu as moins de 18 ans : indique l'e-mail ou le téléphone de ton parent ou tuteur.");
  const pb = passwordProblem(input.password);
  if (pb) throw new AppError(pb);
  const exists = await db.select({ id: schema.users.id }).from(schema.users)
    .where(or(email ? eq(schema.users.email, email) : undefined, phone ? eq(schema.users.phone, phone) : undefined)).limit(1);
  if (exists.length) throw new AppError("Un compte existe déjà avec cet e-mail ou ce numéro.", 409, "doublon");
  if (input.role === "etablissement") {
    if (!input.establishmentId) throw new AppError("Choisissez votre établissement.");
    const [e] = await db.select({ id: schema.establishments.id }).from(schema.establishments).where(eq(schema.establishments.id, input.establishmentId));
    if (!e) throw new AppError("Établissement inconnu : choisissez-le dans la liste.");
  }

  const user = await db.transaction(async (tx) => {
    const [u] = await tx.insert(schema.users).values({
      role: input.role, firstName: input.firstName, lastName: input.lastName, email, phone,
      passwordHash: await hashPassword(input.password), birthYear: input.birthYear ?? null, country: input.country ?? null, city: input.city ?? null,
      // Les comptes établissement sont activés après vérification par l'équipe Navigoal.
      status: input.role === "etablissement" ? "en_attente" : "actif",
    }).returning();
    await tx.insert(schema.profiles).values({ userId: u.id, level: input.level ?? null, serie: input.serie ?? null, currentSchool: input.currentSchool ?? null });
    if (input.role === "etablissement") await tx.insert(schema.establishmentMembers).values({ userId: u.id, establishmentId: input.establishmentId!, role: "admin_ecole" });
    if (input.role === "bailleur") await tx.insert(schema.landlords).values({ userId: u.id, company: input.company ?? null, kind: input.company ? "agence" : "particulier" });
    if ((input.role === "eleve" || input.role === "etudiant") && (input.guardianEmail || input.guardianPhone))
      await tx.insert(schema.guardianships).values({ childId: u.id, inviteEmail: input.guardianEmail ? normEmail(input.guardianEmail) : null, invitePhone: input.guardianPhone ? normPhone(input.guardianPhone) : null, inviteCode: otpCode() });
    return u;
  });
  await audit(user.id, "inscription", "user", user.id, { role: user.role });
  // E-mail de bienvenue (gabarit Navigoal), adapté au rôle.
  if (user.email) {
    const BIENVENUE: Record<string, [string, string, string]> = {
      eleve: ["Fais le test d'orientation, explore les métiers et les formations, puis candidate en ligne aux établissements du Maroc.", "Commencer mon parcours", "/espace/"],
      etudiant: ["Fais le test d'orientation, explore les métiers et les formations, puis candidate en ligne aux établissements du Maroc.", "Commencer mon parcours", "/espace/"],
      parent: ["Suis le parcours de ton enfant : candidatures, paiements sécurisés et logement étudiant au Maroc.", "Ouvrir mon espace parent", "/parent/"],
      etablissement: ["Votre compte établissement est en cours de vérification par l'équipe Navigoal. Vous serez prévenu par e-mail dès son activation.", "Découvrir Navigoal", "/"],
      bailleur: ["Publiez vos logements pour étudiants : ils seront proposés sur Navilease après modération.", "Publier une annonce", "/bailleur/"],
    };
    const [msg, label, url] = BIENVENUE[user.role] ?? BIENVENUE.etudiant;
    await sendEmail({ to: user.email, subject: "Bienvenue sur Navigoal", titre: `Bienvenue ${user.firstName} !`, text: msg, action: { label, url } }).catch(() => {});
  }
  // Invitation du parent/tuteur saisi à l'inscription (code à saisir dans son espace parent).
  const [inv] = await db.select().from(schema.guardianships).where(eq(schema.guardianships.childId, user.id));
  if (inv?.inviteCode) {
    const text = `${user.firstName} ${user.lastName} vous invite à suivre son parcours sur Navigoal et à valider son inscription. Code d'invitation : ${inv.inviteCode}. Créez votre compte parent puis saisissez ce code.`;
    if (inv.inviteEmail) await sendEmail({ to: inv.inviteEmail, subject: "Invitation à suivre un parcours Navigoal", text, action: { label: "Créer mon compte parent", url: "/inscription/?role=parent" } });
    else if (inv.invitePhone) await sendSms({ to: inv.invitePhone, text });
  }
  const otp = email ? await requestOtp(email, "verify_email") : await requestOtp(phone!, "verify_phone");
  return Object.assign(user, { devCode: otp.devCode });
}

export async function findByIdentifier(identifier: string) {
  const id = normId(identifier);
  if (!id) return null;
  // Téléphone saisi sans « + » (ex. 212612345678) : on essaie aussi la forme internationale.
  const where = isEmail(identifier) ? eq(schema.users.email, id) : id.startsWith("+") ? eq(schema.users.phone, id) : or(eq(schema.users.phone, id), eq(schema.users.phone, `+${id}`));
  const [u] = await db.select().from(schema.users).where(where).limit(1);
  return u ?? null;
}

const MAX_FAILS = 8;
export async function login(identifier: string, password: string) {
  if (!identifier.trim() || !password) throw new AppError("Saisissez votre e-mail (ou téléphone) et votre mot de passe.", 400, "champs_requis");
  const key = normId(identifier);
  // Anti force brute : 8 échecs maximum par identifiant sur 15 minutes (compteur remis à zéro par une réinitialisation du mot de passe).
  const u = await findByIdentifier(identifier);
  const since = new Date(Date.now() - 15 * 60_000);
  const [reset] = u ? await db.select({ at: schema.auditLogs.createdAt }).from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.action, "reinitialisation_mdp"), eq(schema.auditLogs.entityId, u.id), gt(schema.auditLogs.createdAt, since))).orderBy(desc(schema.auditLogs.createdAt)).limit(1) : [];
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.action, "connexion_echec"), eq(schema.auditLogs.entityId, key), gt(schema.auditLogs.createdAt, reset?.at ?? since)));
  if (n >= MAX_FAILS) throw new AppError("Trop de tentatives. Réessayez dans 15 minutes, connectez-vous par code ou réinitialisez votre mot de passe.", 429, "trop_de_tentatives");
  if (!u?.passwordHash || !(await verifyPassword(password, u.passwordHash))) {
    await audit(u?.id ?? null, "connexion_echec", "login", key);
    const left = MAX_FAILS - n - 1;
    throw new AppError(left <= 0 ? "Identifiants incorrects. Connexion bloquée 15 minutes : utilisez la connexion par code ou « Mot de passe oublié »."
      : `Identifiants incorrects.${left <= 3 ? ` Encore ${left} essai${left > 1 ? "s" : ""} avant blocage temporaire.` : ""}`, 401, "identifiants");
  }
  if (u.status === "suspendu") throw new AppError("Ce compte est suspendu. Contactez le support.", 403, "suspendu");
  await audit(u.id, "connexion", "user", u.id);
  return u;
}

// ---------------------------------------------------------------- OTP (SMS / e-mail)
type Purpose = (typeof schema.otpPurposeEnum.enumValues)[number];
const OTP_TTL = 10 * 60_000;

export async function requestOtp(target: string, purpose: Purpose) {
  const t = normId(target);
  if (!t || (isEmail(t) ? !z.string().email().safeParse(t).success : !phoneRe.test(t))) throw new AppError("Indiquez une adresse e-mail ou un numéro de téléphone valide.", 400, "cible");
  const recent = await db.select().from(schema.otpCodes).where(and(eq(schema.otpCodes.target, t), eq(schema.otpCodes.purpose, purpose), gt(schema.otpCodes.createdAt, new Date(Date.now() - 3600_000)))).orderBy(desc(schema.otpCodes.createdAt));
  const wait = recent[0] ? Math.ceil((45_000 - (Date.now() - recent[0].createdAt.getTime())) / 1000) : 0;
  if (wait > 0) throw new AppError(`Patientez ${wait} s avant de redemander un code.`, 429, "trop_tot");
  if (recent.length >= 6) throw new AppError("Trop de codes demandés. Réessayez dans une heure.", 429, "trop_de_codes");
  const code = otpCode();
  await db.insert(schema.otpCodes).values({ target: t, purpose, codeHash: sha256(`${t}:${code}`), expiresAt: new Date(Date.now() + OTP_TTL) });
  const text = `Votre code Navigoal : ${code} (valable 10 minutes). Ne le communiquez à personne.`;
  if (t.includes("@")) await sendEmail({ to: t, subject: "Votre code Navigoal", titre: "Votre code de vérification", code, text: "Voici votre code Navigoal, valable 10 minutes. Ne le communiquez à personne, même à un conseiller Navigoal." });
  else await sendSms({ to: t, text });
  return { target: t, devCode: process.env.NODE_ENV !== "production" || process.env.OTP_DEBUG === "1" ? code : undefined };
}

export async function verifyOtp(target: string, purpose: Purpose, code: string) {
  const t = normId(target);
  if (!/^\d{6}$/.test(code.trim())) throw new AppError("Le code comporte 6 chiffres.", 400, "otp_format");
  const [o] = await db.select().from(schema.otpCodes).where(and(eq(schema.otpCodes.target, t), eq(schema.otpCodes.purpose, purpose), isNull(schema.otpCodes.consumedAt))).orderBy(desc(schema.otpCodes.createdAt)).limit(1);
  if (!o || o.expiresAt < new Date()) throw new AppError("Code expiré ou déjà utilisé. Demandez-en un nouveau.", 400, "otp_expire");
  if (o.attempts >= 5) throw new AppError("Trop de tentatives. Demandez un nouveau code.", 429, "otp_bloque");
  if (o.codeHash !== sha256(`${t}:${code.trim()}`)) {
    await db.update(schema.otpCodes).set({ attempts: o.attempts + 1 }).where(eq(schema.otpCodes.id, o.id));
    const left = 4 - o.attempts;
    throw new AppError(left > 0 ? `Code incorrect. Encore ${left} essai${left > 1 ? "s" : ""}.` : "Code incorrect. Demandez un nouveau code.", 400, "otp_faux");
  }
  await db.update(schema.otpCodes).set({ consumedAt: new Date() }).where(eq(schema.otpCodes.id, o.id));
  if (purpose === "verify_email") await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.email, t));
  if (purpose === "verify_phone") await db.update(schema.users).set({ phoneVerifiedAt: new Date() }).where(eq(schema.users.phone, t));
  return t;
}

/** Connexion sans mot de passe par code OTP (usage mobile). */
export async function loginWithOtp(target: string, code: string) {
  const t = await verifyOtp(target, "login", code);
  const u = await findByIdentifier(t);
  if (!u) throw new AppError("Aucun compte associé.", 404, "introuvable");
  if (u.status === "suspendu") throw new AppError("Ce compte est suspendu.", 403, "suspendu");
  if (t.includes("@")) await db.update(schema.users).set({ emailVerifiedAt: u.emailVerifiedAt ?? new Date() }).where(eq(schema.users.id, u.id));
  else await db.update(schema.users).set({ phoneVerifiedAt: u.phoneVerifiedAt ?? new Date() }).where(eq(schema.users.id, u.id));
  return u;
}

export async function resetPassword(target: string, code: string, password: string) {
  const pb = passwordProblem(password);
  if (pb) throw new AppError(pb);
  const t = await verifyOtp(target, "reset_password", code);
  const u = await findByIdentifier(t);
  if (!u) throw new AppError("Aucun compte associé.", 404, "introuvable");
  await db.update(schema.users).set({ passwordHash: await hashPassword(password) }).where(eq(schema.users.id, u.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
  await audit(u.id, "reinitialisation_mdp", "user", u.id);
}

export async function changePassword(userId: string, current: string, next: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u.passwordHash || !(await verifyPassword(String(current ?? ""), u.passwordHash))) throw new AppError("Mot de passe actuel incorrect.");
  const pb = passwordProblem(String(next ?? ""));
  if (pb) throw new AppError(pb);
  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, userId));
  await audit(userId, "changement_mdp", "user", userId);
}

// ---------------------------------------------------------------- Profil
export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  birthYear: z.coerce.number().int().min(1940).max(new Date().getFullYear()).optional(),
  country: z.string().trim().toUpperCase().refine(isCountryCode, "Pays inconnu.").optional(),
  city: z.string().trim().max(80).optional(),
  level: z.string().max(40).optional(),
  serie: z.string().max(40).optional(),
  currentSchool: z.string().max(160).optional(),
  diploma: z.string().max(80).optional(),
  domain: z.string().max(60).optional(),
  skills: z.array(z.string().max(60)).max(40).optional(),
  interests: z.array(z.string().max(60)).max(30).optional(),
  goals: z.string().max(2000).optional(),
  preferences: z.object({
    pays: z.array(z.string()).optional(), villes: z.array(z.string()).optional(), budgetAnnuel: z.number().optional(), devise: z.string().optional(),
    logement: z.object({ budget: z.number().optional(), type: z.string().optional(), colocation: z.boolean().optional() }).optional(),
  }).optional(),
});

export async function getMe(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const { passwordHash: _p, totpSecret: _t, ...safe } = u;
  return { ...safe, profile: p ?? null };
}

export async function updateProfile(userId: string, raw: z.input<typeof profileSchema>) {
  const i = profileSchema.parse(raw);
  const userPart = { firstName: i.firstName, lastName: i.lastName, birthYear: i.birthYear, country: i.country, city: i.city };
  const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
  if (Object.keys(clean(userPart)).length) await db.update(schema.users).set(clean(userPart)).where(eq(schema.users.id, userId));
  const prof = clean({ level: i.level, serie: i.serie, currentSchool: i.currentSchool, diploma: i.diploma, domain: i.domain, skills: i.skills, interests: i.interests, goals: i.goals, preferences: i.preferences });
  await db.insert(schema.profiles).values({ userId, ...prof }).onConflictDoUpdate({ target: schema.profiles.userId, set: prof });
  return getMe(userId);
}

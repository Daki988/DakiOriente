// Note de Navigoal et témoignages donnés depuis le profil (novembre 2026). Un avis par compte, modifiable ou supprimable.
// La note compte tout de suite dans la moyenne ; le témoignage n'est publié qu'avec l'accord de la personne et après
// relecture par l'équipe (/admin/avis), puis affiché sur « Pourquoi Navigoal ».
// Pas de données structurées « AggregateRating » : Google refuse les avis qu'un site publie sur lui-même.
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { audit } from "../lib/audit";
import { notify } from "./notifications";
import { nomPays } from "@/lib/pays-origine";

type User = typeof schema.users.$inferSelect;
const AUTORISES = ["eleve", "etudiant", "parent", "etablissement", "bailleur"];
export const ROLE_AVIS: Record<string, [string, string]> = { eleve: ["Élève", "Une élève ou un élève"], etudiant: ["Étudiant·e", "Une étudiante ou un étudiant"], parent: ["Parent", "Un parent"], etablissement: ["École", "Une école"], bailleur: ["Bailleur Navilease", "Un bailleur"] };

export const avisServiceSchema = z.object({
  note: z.number().int().min(1, "Choisissez une note de 1 à 5.").max(5),
  temoignage: z.string().trim().max(800, "800 caractères au plus.").optional().nullable(),
  publier: z.boolean().default(false),
  affichage: z.enum(["prenom", "anonyme"]).default("prenom"),
});

export async function monAvis(user: User) {
  const [a] = await db.select().from(schema.avisService).where(eq(schema.avisService.userId, user.id));
  return a ?? null;
}

export async function enregistrer(user: User, raw: unknown) {
  if (!AUTORISES.includes(user.role)) throw forbidden();
  const i = avisServiceSchema.parse(raw);
  const texte = i.temoignage?.trim() || null;
  if (texte && texte.length < 30) throw new AppError("Votre témoignage est un peu court : 30 caractères au moins.");
  const avant = await monAvis(user);
  // Un témoignage à publier (nouveau ou modifié) repasse en relecture ; sans témoignage ou sans accord, rien à publier.
  const change = texte !== (avant?.temoignage ?? null) || i.publier !== avant?.publier || i.affichage !== avant?.affichage;
  const statut = !texte || !i.publier ? "sans_temoignage" : change || avant?.statut === "refuse" ? "en_attente" : avant!.statut;
  const valeurs = { note: i.note, temoignage: texte, publier: i.publier, affichage: i.affichage, statut, motif: statut === "en_attente" ? null : avant?.motif ?? null };
  const [a] = avant
    ? await db.update(schema.avisService).set(valeurs).where(eq(schema.avisService.id, avant.id)).returning()
    : await db.insert(schema.avisService).values({ userId: user.id, ...valeurs }).returning();
  if (statut === "en_attente" && avant?.statut !== "en_attente") {
    const admins = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")));
    for (const ad of admins) await notify(ad.id, { kind: "temoignage", title: `Nouveau témoignage à relire (${i.note}/5)`, body: texte!.slice(0, 160), link: "/admin/avis/" });
  }
  memo = null;
  return a;
}

export async function supprimer(user: User) {
  await db.delete(schema.avisService).where(eq(schema.avisService.userId, user.id));
  memo = null;
}

const nomAffiche = (u: { firstName: string; lastName: string; role: string; country: string | null }, affichage: string) =>
  affichage === "prenom" ? `${u.firstName} ${u.lastName.charAt(0)}.` : `${ROLE_AVIS[u.role]?.[1] ?? "Un utilisateur"}${u.country ? `, ${nomPays(u.country)}` : ""}`;

let memo: { at: number; data: Awaited<ReturnType<typeof calculer>> } | null = null;
async function calculer(limite: number) {
  const [stats] = (await db.execute(sql`select count(*)::int as nombre, round(avg(note)::numeric, 1)::float as moyenne from avis_service`)).rows as { nombre: number; moyenne: number | null }[];
  const lignes = await db.select({ a: schema.avisService, u: { firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role, country: schema.users.country } })
    .from(schema.avisService).innerJoin(schema.users, eq(schema.users.id, schema.avisService.userId))
    .where(eq(schema.avisService.statut, "publie")).orderBy(desc(schema.avisService.modereLe)).limit(limite);
  return {
    nombre: stats?.nombre ?? 0, moyenne: stats?.moyenne ?? null,
    temoignages: lignes.map(({ a, u }) => ({ id: a.id, note: a.note, texte: a.temoignage!, nom: nomAffiche(u, a.affichage), profil: ROLE_AVIS[u.role]?.[0] ?? "", pays: u.country ? nomPays(u.country) : null, le: a.modereLe })),
  };
}
/** Moyenne, nombre de notes et témoignages publiés (gardés 10 min en mémoire). */
export async function publics() {
  if (memo && Date.now() - memo.at < 600e3) return memo.data;
  memo = { at: Date.now(), data: await calculer(24) };
  return memo.data;
}

export async function listeAdmin(statut?: string | null) {
  const lignes = await db.select({ a: schema.avisService, u: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role, country: schema.users.country, email: schema.users.email } })
    .from(schema.avisService).innerJoin(schema.users, eq(schema.users.id, schema.avisService.userId))
    .where(statut ? eq(schema.avisService.statut, statut) : undefined).orderBy(desc(schema.avisService.updatedAt)).limit(300);
  const [stats] = (await db.execute(sql`select count(*)::int as nombre, round(avg(note)::numeric, 2)::float as moyenne,
      count(*) filter (where statut = 'en_attente')::int as a_relire, count(*) filter (where statut = 'publie')::int as publies,
      count(*) filter (where note = 5)::int n5, count(*) filter (where note = 4)::int n4, count(*) filter (where note = 3)::int n3, count(*) filter (where note = 2)::int n2, count(*) filter (where note = 1)::int n1
    from avis_service`)).rows as Record<string, number>[];
  return { stats, lignes: lignes.map(({ a, u }) => ({ ...a, auteur: { ...u, affiche: nomAffiche(u, a.affichage) } })) };
}

export const moderationSchema = z.object({ statut: z.enum(["publie", "refuse"]), motif: z.string().trim().max(500).optional() });
export async function moderer(admin: User, id: string, raw: unknown) {
  const i = moderationSchema.parse(raw);
  if (i.statut === "refuse" && !i.motif) throw new AppError("Indiquez le motif du refus : il est envoyé à l'auteur.");
  const [a] = await db.select().from(schema.avisService).where(eq(schema.avisService.id, id));
  if (!a) throw notFound("Témoignage");
  if (!a.temoignage || !a.publier) throw new AppError("Ce témoignage n'est pas proposé à la publication.");
  await db.update(schema.avisService).set({ statut: i.statut, motif: i.statut === "refuse" ? i.motif! : null, moderePar: admin.id, modereLe: new Date() }).where(eq(schema.avisService.id, id));
  await audit(admin.id, "moderation_temoignage", "avis_service", id, { statut: i.statut });
  await notify(a.userId, i.statut === "publie"
    ? { kind: "temoignage", title: "Votre témoignage est publié, merci !", body: "Il aide d'autres familles à choisir Navigoal.", link: "/pourquoi/#temoignages" }
    : { kind: "temoignage", title: "Votre témoignage n'a pas été publié", body: `Motif : ${i.motif}. Vous pouvez le modifier depuis votre profil.`, link: "/compte/#avis" });
  memo = null;
}

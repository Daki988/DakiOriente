// Bourses (novembre 2026, docs/specs/2026-11-chantiers-fonctionnels.md, chantier 4) : « Bourses pour toi »,
// suivi d'une bourse et alertes (ouverture, J-30 et J-7 avant la date limite) à l'élève et à ses parents.
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { notify } from "./notifications";
import { childrenOf, guardiansOf } from "./guardians";
import { listCampaigns } from "./establishments";
import { BOURSES, bourseById, boursesPour, type Profil } from "@/lib/bourses";
import { etabById } from "@/lib/data";

type User = typeof schema.users.$inferSelect;
const ROLES = ["eleve", "etudiant", "parent"];
const JOUR = 864e5;

async function profilDe(u: Pick<User, "id" | "country" | "birthYear">): Promise<Profil> {
  const [p] = await db.select({ average: schema.profiles.average, serie: schema.profiles.serie }).from(schema.profiles).where(eq(schema.profiles.userId, u.id));
  return { pays: u.country, anneeNaissance: u.birthYear, moyenne: p?.average ?? null, serie: p?.serie ?? null, destination: "MA" };
}

/** Bourses classées pour l'élève (ou pour chacun des enfants d'un parent), bourses suivies, bourses des écoles ouvertes. */
export async function pourMoi(user: User) {
  if (!ROLES.includes(user.role)) throw forbidden();
  const personnes = user.role === "parent"
    ? (await childrenOf(user.id)).map((c) => c.child)
    : [user];
  const profils = await Promise.all(personnes.map(async (p) => {
    const profil = await profilDe(p);
    return {
      id: p.id, prenom: p.firstName, manque: [!profil.pays && "pays", !profil.anneeNaissance && "année de naissance", profil.moyenne == null && "moyenne"].filter(Boolean) as string[],
      bourses: boursesPour(profil).map(({ bourse, verdict }) => ({ id: bourse.id, nom: bourse.nom, organisme: bourse.organisme, date_limite: bourse.date_limite, ...verdict })),
    };
  }));
  const campagnes = (await listCampaigns({ publishedOnly: true, current: true })).filter((c) => c.kind === "bourse" && etabById[c.establishmentId])
    .map((c) => ({ id: c.id, eid: c.establishmentId, ecole: etabById[c.establishmentId].sigle || etabById[c.establishmentId].nom, titre: c.title, fin: c.endsAt, conditions: c.conditions }));
  return { profils, suivies: await suivies(user.id), campagnes };
}

export async function suivies(userId: string) {
  return (await db.select({ id: schema.boursesSuivies.bourseId }).from(schema.boursesSuivies).where(eq(schema.boursesSuivies.userId, userId))).map((r) => r.id);
}
export async function suivre(user: User, bourseId: string, oui: boolean) {
  if (!ROLES.includes(user.role)) throw new AppError("Le suivi des bourses est réservé aux élèves, étudiants et parents.", 403, "forbidden");
  if (!bourseById[bourseId]) throw notFound("Bourse");
  if (oui) await db.insert(schema.boursesSuivies).values({ userId: user.id, bourseId }).onConflictDoNothing();
  else await db.delete(schema.boursesSuivies).where(and(eq(schema.boursesSuivies.userId, user.id), eq(schema.boursesSuivies.bourseId, bourseId)));
}

const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;
const jourIso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Alertes quotidiennes (tâche rappels-offres) : ouverture de la campagne, puis J-30 et J-7 avant la date limite,
 * à chaque compte qui suit la bourse et, pour un élève, à ses parents. Une seule fois par palier.
 */
export async function alertesBourses(maintenant = new Date()) {
  let envoyees = 0;
  const auj = jourIso(maintenant);
  for (const b of BOURSES) {
    const paliers: [string, string][] = [];
    if (b.ouverture && b.ouverture <= auj && (!b.date_limite || b.date_limite >= auj)) paliers.push(["ouverture", `Candidatures ouvertes : ${b.nom}`]);
    if (b.date_limite) {
      const reste = Math.ceil((new Date(`${b.date_limite}T23:59:59Z`).getTime() - maintenant.getTime()) / JOUR);
      if (reste >= 0 && reste <= 7) paliers.push(["j7", `Plus que ${reste} jour${reste > 1 ? "s" : ""} pour candidater : ${b.nom}`]);
      else if (reste > 7 && reste <= 30) paliers.push(["j30", `Date limite dans ${reste} jours : ${b.nom}`]);
    }
    if (!paliers.length) continue;
    const abonnes = await db.select({ u: schema.users }).from(schema.boursesSuivies).innerJoin(schema.users, eq(schema.users.id, schema.boursesSuivies.userId)).where(eq(schema.boursesSuivies.bourseId, b.id));
    for (const { u } of abonnes) for (const [palier, titre] of paliers) {
      if (!(await premiereFois(`bourse:${b.id}:${b.date_limite ?? b.ouverture}:${palier}:${u.id}`))) continue;
      const n = { kind: "bourse", title: titre, body: `${b.organisme}. Pièces et démarche sur la fiche.`, link: `/bourses/${b.id}/` };
      await notify(u.id, n); envoyees++;
      if (u.role !== "parent") for (const g of await guardiansOf(u.id)) if (g.link.status === "actif" && g.parent?.id) await notify(g.parent.id, { ...n, title: `${u.firstName} — ${titre}` });
    }
  }
  return { envoyees };
}

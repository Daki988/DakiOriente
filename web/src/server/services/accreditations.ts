// Suivi des accréditations (back-office « Accréditations ») : filières en mention « renouvellement non encore publié »,
// prochaines échéances, filières retirées, propositions de l'assistant IA, et saisie des renouvellements publiés au
// Bulletin officiel. Un renouvellement validé vaut tout de suite pour les candidatures (table programs) ; le robot
// GitHub (accreditations.yml) le reporte ensuite dans data/sources/maroc/renouvellements.csv et met le site à jour.
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import suivi from "@/data/suivi_accreditations.json";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { forbidden } from "../lib/errors";

type User = typeof schema.users.$inferSelect;
type Ligne = { etablissement_id: string; etablissement: string; filiere: string; composante: string; fin: string; texte: string; retrait_prevu?: string };
type Proposition = { etablissement_id: string; filiere: string; composante?: string; fin: string; arrete: string; bulletin_officiel: string; date_publication?: string; source?: string; extrait?: string; trouve_le?: string };
const S = suivi as unknown as { _meta: { date: string; annee_reference: string; delai_mention_annees: number; regle: string }; en_mention: Ligne[]; a_echeance: Ligne[]; retirees_cette_annee: Ligne[]; propositions: Proposition[] };

const cle = (x: { etablissement_id?: string; etablissementId?: string; filiere: string; composante?: string | null }) =>
  `${x.etablissement_id ?? x.etablissementId}|${x.filiere.trim().toLowerCase()}|${(x.composante ?? "").trim().toLowerCase()}`;
const annee = z.string().regex(/^(\d{4})-(\d{4})$/, "Année au format 2030-2031.").refine((a) => Number(a.slice(5)) === Number(a.slice(0, 4)) + 1, "Année au format 2030-2031.");

export async function vue(admin: User) {
  if (admin.role !== "admin") throw forbidden();
  const lignes = await db.select().from(schema.accreditationRenouvellements).where(gte(schema.accreditationRenouvellements.le, new Date(Date.now() - 400 * 864e5)))
    .orderBy(desc(schema.accreditationRenouvellements.le));
  const traitees = new Map(lignes.map((l) => [cle(l), l]));
  return {
    meta: S._meta,
    en_mention: S.en_mention.map((l) => ({ ...l, renouvellement: traitees.get(cle(l))?.statut === "valide" ? traitees.get(cle(l)) : null })),
    a_echeance: S.a_echeance,
    retirees: S.retirees_cette_annee,
    // Propositions de l'assistant IA encore sans décision
    propositions: S.propositions.filter((p) => !traitees.has(cle(p))),
    saisies: lignes,
  };
}

const saisie = z.object({
  etablissementId: z.string().min(2).max(80),
  filiere: z.string().trim().min(2).max(300),
  composante: z.string().trim().max(300).default(""),
  fin: annee,
  arrete: z.string().trim().min(2).max(40),
  bulletinOfficiel: z.string().trim().regex(/^\d{3,5}$/, "N° du Bulletin officiel (chiffres seulement)."),
  datePublication: z.string().trim().max(40).optional(),
  source: z.string().trim().max(500).optional(),
  origine: z.enum(["admin", "ia"]).default("admin"),
});

/** Renouvellement publié au Bulletin officiel : enregistré et appliqué tout de suite aux candidatures. */
export async function valider(admin: User, body: unknown) {
  if (admin.role !== "admin") throw forbidden();
  const i = saisie.parse(body);
  const [r] = await db.insert(schema.accreditationRenouvellements).values({ ...i, statut: "valide", parId: admin.id }).returning();
  const texte = `Arrêté ${i.arrete} (BO n° ${i.bulletinOfficiel}), renouvellement validé le ${new Date().toISOString().slice(0, 10)}`;
  const progs = await db.update(schema.programs).set({ homologated: true, active: true, homologation: { statut: "accreditee", fin: i.fin, texte } })
    .where(and(eq(schema.programs.establishmentId, i.etablissementId), eq(schema.programs.title, i.filiere), eq(schema.programs.faculty, i.composante)))
    .returning({ id: schema.programs.id });
  await audit(admin.id, "accreditation_renouvelee", "establishment", i.etablissementId, { ...i, programmes: progs.length });
  return { ...r, programmesMisAJour: progs.length };
}

/** Proposition de l'assistant IA écartée (source erronée, autre filière…). */
export async function rejeter(admin: User, body: unknown) {
  if (admin.role !== "admin") throw forbidden();
  const i = saisie.parse(body);
  const [r] = await db.insert(schema.accreditationRenouvellements).values({ ...i, statut: "rejete", origine: "ia", parId: admin.id }).returning();
  await audit(admin.id, "accreditation_proposition_rejetee", "establishment", i.etablissementId, i);
  return r;
}

/** Pour le robot de synchronisation : renouvellements validés pas encore reportés dans le registre du dépôt. */
export async function aReporter() {
  return db.select().from(schema.accreditationRenouvellements)
    .where(and(eq(schema.accreditationRenouvellements.statut, "valide"), eq(schema.accreditationRenouvellements.reporte, false)));
}

// Cachet numérique des devis PDF (novembre 2026). Au clic sur « Télécharger le devis PDF », le navigateur envoie les
// paramètres du devis ; le serveur le recalcule lui-même (aucun montant venu du navigateur n'est cru), l'enregistre
// sous un identifiant aléatoire et renvoie numéro, empreinte et adresse de vérification. Le QR code du PDF mène à
// /verifier/devis/<id>/, qui affiche ce que Navigoal a réellement émis : un PDF retouché ne correspond plus.
import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError } from "../lib/errors";
import { limiter } from "../lib/counters";
import { COUTS, devis, LOGEMENT_LABEL, type AnnonceDevis, type Logement } from "@/lib/devis";
import { convertirDe } from "@/lib/devises";
import { etabById, formationById } from "@/lib/data";
import { residencesEtudiantes } from "@/lib/residences";

const VALIDITE_JOURS = 60;
const PersoZ = z.object({
  logement: z.string().max(80), niveau: z.enum(["econome", "normal", "confortable"]), transport: z.enum(["tram", "taxi"]), assurance: z.enum(["base", "complete"]),
  retours: z.number().int().min(0).max(2), ordinateur: z.boolean(), soutien: z.boolean(), aide: z.number().min(0).max(10_000_000),
});
const CachetZ = z.object({
  eid: z.string().min(1).max(80), fid: z.string().min(1).max(120), origine: z.string().max(2).default(""),
  logement: z.enum(Object.keys(LOGEMENT_LABEL) as [Logement, ...Logement[]]).default("studio"),
  perso: PersoZ.nullable().default(null), exclus: z.array(z.string().max(30)).max(20).default([]),
  eleve: z.string().trim().max(80).default(""), payeur: z.string().trim().max(80).default(""),
});

export async function creerCachet(raw: unknown, ip: string) {
  const p = CachetZ.parse(raw);
  const e = etabById[p.eid], F = formationById[p.fid];
  if (!e || !F || !e.formations.includes(p.fid)) throw new AppError("Devis inconnu.");
  await limiter(`cachet:${ip || "inconnue"}`, 40, 3600, "Trop de devis certifiés depuis cette connexion. Réessayez dans une heure.");
  const residences = residencesEtudiantes.filter((r) => r.ville === e.ville && r.logements.some((l) => l.loyer_min));
  // Annonce Navilease choisie : loyer, charges et caution relus en base (annonce publiée seulement).
  const annonces: AnnonceDevis[] = [];
  const idAnnonce = p.perso?.logement.startsWith("nl:") ? p.perso.logement.slice(3) : "";
  if (idAnnonce) {
    const [h] = await db.select().from(schema.housings).where(and(eq(schema.housings.id, idAnnonce), eq(schema.housings.status, "publie")));
    if (h) {
      const dev = COUTS[e.pays].devise;
      const enBase = (v: number) => (h.currency === dev ? v : convertirDe(v, h.currency, dev) ?? v);
      annonces.push({ id: h.id, titre: h.title, ville: h.ville, quartier: h.quartier, type: h.type, loyer: Math.round(enBase(h.rent + h.charges)), caution: Math.round(enBase(h.deposit)) });
    }
  }
  const D = devis(p.eid, p.fid, p.origine, p.logement, p.perso ? { ...p.perso, residences, annonces } : undefined, p.exclus);
  const n = D.years * 12;
  const resume = {
    ecole: e.nom, sigle: e.sigle ?? "", ville: e.ville, formation: F.intitule, diplome: F.diplome, annees: D.years, devise: D.devise,
    total: D.total, parMois: [Math.round(D.total[0] / n), Math.round(D.total[1] / n)], aides: D.aides ?? null,
    rubriques: D.cats, logement: D.logementLibelle ?? LOGEMENT_LABEL[p.logement],
    exclus: D.detail.filter((x) => !x.inclus).map((x) => x.libelle.replace(/,.*$| \(une fois\)$/, "")),
  };
  const id = randomBytes(15).toString("base64url");
  const emis = new Date();
  const numero = `NG-${emis.getFullYear()}-${String(emis.getMonth() + 1).padStart(2, "0")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const empreinte = createHash("sha256").update(JSON.stringify({ id, numero, emis: emis.toISOString(), resume, eleve: p.eleve, payeur: p.payeur })).digest("hex").slice(0, 16).toUpperCase().replace(/(.{4})(?!$)/g, "$1-");
  await db.insert(schema.devisCachets).values({ id, numero, parametres: { eid: p.eid, fid: p.fid, origine: p.origine, logement: p.logement, perso: p.perso, exclus: p.exclus }, resume, eleve: p.eleve, payeur: p.payeur, empreinte, createdAt: emis });
  return { id, numero, empreinte, emisLe: emis.toISOString(), valableJusquau: new Date(emis.getTime() + VALIDITE_JOURS * 86400e3).toISOString(), chemin: `/verifier/devis/${id}/` };
}

export async function lireCachet(id: string) {
  if (!/^[A-Za-z0-9_-]{20}$/.test(id)) return null;
  const [c] = await db.select().from(schema.devisCachets).where(eq(schema.devisCachets.id, id));
  if (!c) return null;
  return { ...c, resume: c.resume as { ecole: string; sigle: string; ville: string; formation: string; diplome: string; annees: number; devise: string; total: [number, number]; parMois: [number, number]; aides: [number, number] | null; rubriques: Record<string, [number, number]>; logement: string; exclus: string[] }, valableJusquau: new Date(c.createdAt.getTime() + VALIDITE_JOURS * 86400e3) };
}

/** Effacement des cachets de plus d'un an (tâche quotidienne). */
export async function purgerCachets(maintenant = new Date()) {
  const r = await db.delete(schema.devisCachets).where(lt(schema.devisCachets.createdAt, new Date(maintenant.getTime() - 365 * 86400e3))).returning({ id: schema.devisCachets.id });
  return r.length;
}

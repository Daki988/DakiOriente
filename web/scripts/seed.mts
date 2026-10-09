// Données de démarrage : référentiels, établissements (79) et leurs formations indicatives, articles, admin.
// Idempotent : n'écrase pas les modifications faites depuis le back-office ou les espaces établissement.
// Usage : npx tsx scripts/seed.mts            (SEED_DEMO=1 pour créer aussi des comptes de démonstration)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const REF = path.resolve(here, "..", "..", "data", "referentiels");
const read = (n: string) => JSON.parse(fs.readFileSync(path.join(REF, `${n}.json`), "utf8"));
const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
if (!url) { console.log("Seed ignoré : aucune base configurée."); process.exit(0); }
const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
const db = drizzle({ client: pool, schema });

const logoUrl = (l?: { fichier: string }) => (l ? "/" + l.fichier.replace(/^assets\//, "") : null);
const photo = (p: { fichier: string; credit: string | null; licence: string | null; page_source: string | null }) => ({ src: "/" + p.fichier.replace(/^assets\//, ""), credit: p.credit, licence: p.licence, page: p.page_source });
const CUR: Record<string, string> = { GA: "XAF", MA: "MAD", SN: "XOF" };

async function seedRefs() {
  const ins = async (t: any, rows: any[]) => { for (let i = 0; i < rows.length; i += 200) await db.insert(t).values(rows.slice(i, i + 200)).onConflictDoNothing(); };
  await ins(schema.refPays, read("pays").items.map((p: any) => ({ id: p.id, data: p })));
  await ins(schema.refDomaines, read("domaines").items.map((d: any) => ({ id: d.id, libelle: d.libelle, data: d })));
  await ins(schema.refCompetences, read("competences").items.map((c: any) => ({ id: c.id, libelle: c.libelle, data: c })));
  await ins(schema.refMetiers, read("metiers").items.map((m: any) => ({ id: m.id, nom: m.nom, domaine: m.domaine, data: m })));
  await ins(schema.refFormations, read("formations").items.map((f: any) => ({ id: f.id, intitule: f.intitule, domaine: f.domaine, data: f })));
  await ins(schema.refSeries, read("series").items.map((s: any) => ({ id: s.id, pays: s.pays, data: s })));
}

async function seedEstablishments() {
  const formations = Object.fromEntries(read("formations").items.map((f: any) => [f.id, f]));
  const couts = Object.fromEntries(read("couts_etudes").items.map((c: any) => [c.id, c]));
  const etabs = read("etablissements_superieurs").items;
  for (const e of etabs) {
    await db.insert(schema.establishments).values({
      id: e.id, nom: e.nom, sigle: e.sigle, pays: e.pays, ville: e.ville, type: e.type, typeLibelle: e.type_libelle, statut: e.statut, siteWeb: e.site_web,
      anneeCreation: e.annee_creation, lat: e.coordonnees?.lat ?? null, lng: e.coordonnees?.lng ?? null, logo: logoUrl(e.logo), photos: (e.photos ?? []).map(photo),
    }).onConflictDoNothing();
    const sco = couts[e.pays].scolarite_annuelle[e.type] ?? couts[e.pays].scolarite_annuelle.universite;
    const progs = e.formations.filter((f: string) => formations[f]).map((f: string) => ({
      establishmentId: e.id, formationId: f, title: formations[f].intitule, durationYears: formations[f].duree_annees, currency: CUR[e.pays],
      tuitionMin: sco.min, tuitionMax: sco.max, feesConfirmed: false, indicative: true,
      admission: { series: [...new Set(Object.values(formations[f].series_recommandees).flat())] as string[], concours: formations[f].mode_admission === "concours", entretien: formations[f].mode_admission === "dossier+entretien" },
    }));
    if (progs.length) await db.insert(schema.programs).values(progs).onConflictDoNothing();
  }
  return etabs.length;
}

const ARTICLES = [
  { slug: "bourses-2026", category: "Bourses", title: "Bourses d'études 2026 : 10 opportunités pour les étudiants africains", excerpt: "Une sélection de bourses disponibles en Afrique et à l'international pour poursuivre vos études.",
    body: "## Où chercher\n\nLes bourses proviennent des écoles elles-mêmes (mérite, excellence, fratrie), des agences nationales de bourses et des programmes de coopération.\n\n## Nos conseils\n\n- Préparez vos relevés de notes et une lettre de motivation dès la Première.\n- Vérifiez les dates limites : la plupart des campagnes ferment entre mars et juin.\n- Sur Navigoal, filtrez les campagnes « Bourse » des établissements partenaires.", pays: [] },
  { slug: "choisir-sa-serie", category: "Orientation", title: "Comment bien choisir sa série après le BEPC, le BFEM ou le tronc commun ?", excerpt: "Nos conseils pratiques pour faire le bon choix selon ton profil et ton projet.",
    body: "## Partir de ton profil\n\nLe test d'orientation Navigoal révèle tes centres d'intérêt dominants (RIASEC). Croise-les avec tes matières fortes.\n\n## Regarder les débouchés\n\nChaque série ouvre des formations et des métiers différents : consulte « Ma série au lycée » pour les voir.\n\n## En parler\n\nÉchange avec tes parents, tes professeurs et un conseiller Navigoal avant de décider.", pays: ["GA", "SN", "MA"] },
  { slug: "etudier-au-maroc", category: "International", title: "Étudier au Maroc quand on est Gabonais : démarches, coûts et logement", excerpt: "Visa, préinscription, budget mensuel et recherche de logement avec Navilease.",
    body: "## Visa et séjour\n\nLes ressortissants gabonais sont dispensés de visa de court séjour. Une carte de séjour étudiant est demandée à la préfecture de police dans les 90 jours suivant l'arrivée.\n\n## Budget\n\nComptez 3 100 à 7 500 MAD par mois selon la ville, en plus des frais de scolarité des écoles privées (20 000 à 100 000 MAD par an). Le simulateur de devis Navigoal calcule le coût total.\n\n## Logement\n\nRéservez un logement vérifié Navilease avant le départ : paiement en séquestre, contrat numérique, état des lieux.", pays: ["MA"] },
  { slug: "ia-education", category: "Innovation", title: "L'intelligence artificielle au service de l'éducation en Afrique", excerpt: "De nouvelles solutions pour améliorer l'apprentissage et l'orientation.",
    body: "## Ce qui change\n\nTutorat adaptatif, correction assistée, orientation personnalisée : l'IA aide élèves et enseignants à gagner du temps.\n\n## Les métiers qui recrutent\n\nData analyst, data scientist, ingénieur IA : des formations existent au Maroc et au Sénégal. Consulte les fiches métiers et compare les écoles sur Navigoal.", pays: [] },
  { slug: "metiers-btp", category: "Métiers", title: "Métiers du bâtiment : des opportunités pour les jeunes africains", excerpt: "Un secteur en pleine croissance, du BTS au diplôme d'ingénieur.",
    body: "## Un secteur qui recrute\n\nRoutes, logements, énergie : les chantiers se multiplient au Gabon, au Maroc et au Sénégal.\n\n## Quelles formations ?\n\n- BTS bâtiment ou travaux publics (2 ans)\n- Licence professionnelle génie civil (3 ans)\n- Diplôme d'ingénieur génie civil (5 ans)", pays: [] },
  { slug: "premiere-annee", category: "Vie étudiante", title: "Vie étudiante : 7 conseils pour réussir sa première année", excerpt: "Organisation, méthodes de travail et bonnes habitudes dès la rentrée.",
    body: "1. Planifie ta semaine.\n2. Travaille en groupe.\n3. Va voir tes enseignants.\n4. Garde un budget mensuel.\n5. Dors suffisamment.\n6. Implique-toi dans une association.\n7. Demande de l'aide tôt.", pays: [] },
];

async function seedContent(adminId: string | null) {
  for (const a of ARTICLES) await db.insert(schema.articles).values({ ...a, authorId: adminId, published: true, publishedAt: new Date() }).onConflictDoNothing();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.testimonials);
  if (!n) await db.insert(schema.testimonials).values([
    { name: "Amina M.", role: "Terminale C, Libreville", quote: "Le comparateur m'a permis de choisir mon école d'ingénieurs au Maroc en connaissant le budget total.", pays: "GA", published: true },
    { name: "Jean-Paul M.", role: "Parent", quote: "Le devis m'a donné une vision claire du coût sur cinq ans, visa compris.", pays: "GA", published: true },
  ]);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) { console.log("ADMIN_EMAIL / ADMIN_PASSWORD non définis : pas de compte administrateur créé."); return null; }
  const [ex] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (ex) return ex.id;
  const [u] = await db.insert(schema.users).values({ role: "admin", firstName: "Admin", lastName: "Navigoal", email, passwordHash: await bcrypt.hash(password, 11), emailVerifiedAt: new Date() }).returning();
  await db.insert(schema.profiles).values({ userId: u.id });
  console.log(`Administrateur créé : ${email}`);
  return u.id;
}

/** Comptes de démonstration (mot de passe commun DEMO_PASSWORD, défaut « Navigoal2026 »). */
async function seedDemo() {
  const pw = await bcrypt.hash(process.env.DEMO_PASSWORD || "Navigoal2026", 11);
  const year = new Date().getFullYear();
  const mk = async (email: string, v: Partial<typeof schema.users.$inferInsert> & { role: any; firstName: string; lastName: string }) => {
    const [ex] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (ex) return ex;
    const [u] = await db.insert(schema.users).values({ ...v, email, passwordHash: pw, emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.profiles).values({ userId: u.id, level: v.role === "etudiant" ? "terminale" : null, serie: v.role === "etudiant" ? "ga-bac-c" : null, riasec: v.role === "etudiant" ? { scores: { I: 22, C: 18, R: 15, E: 10, S: 9, A: 6 }, top: ["I", "C", "R"] } : null }).onConflictDoNothing();
    return u;
  };
  const amina = await mk("amina.demo@navigoal.com", { role: "etudiant", firstName: "Amina", lastName: "Mba", birthYear: year - 18, country: "GA", city: "Libreville", phone: "+24107000001" });
  const parent = await mk("parent.demo@navigoal.com", { role: "parent", firstName: "Jean-Paul", lastName: "Mba", country: "GA", city: "Libreville", phone: "+24107000002" });
  const ecole = await mk("ecole.demo@navigoal.com", { role: "etablissement", firstName: "Salma", lastName: "Bennani", country: "MA", city: "Casablanca" });
  const bailleur = await mk("bailleur.demo@navigoal.com", { role: "bailleur", firstName: "Karim", lastName: "Alaoui", country: "MA", city: "Casablanca", phone: "+212600000003" });
  await mk("conseiller.demo@navigoal.com", { role: "conseiller", firstName: "Fatou", lastName: "Diop", country: "SN", city: "Dakar" });
  await db.insert(schema.guardianships).values({ parentId: parent.id, childId: amina.id, status: "actif", consentAt: new Date() }).onConflictDoNothing();
  await db.insert(schema.establishmentMembers).values({ userId: ecole.id, establishmentId: "ma-esa-casa", role: "admin_ecole" }).onConflictDoNothing();
  await db.update(schema.establishments).set({ status: "verifie" }).where(eq(schema.establishments.id, "ma-esa-casa"));
  await db.insert(schema.landlords).values({ userId: bailleur.id, kycStatus: "valide", partner: true, kind: "agence", company: "Résidences Maârif" }).onConflictDoNothing();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.housings).where(eq(schema.housings.landlordId, bailleur.id));
  if (!n) await db.insert(schema.housings).values([
    { landlordId: bailleur.id, title: "Studio meublé Maârif", type: "studio", description: "Studio lumineux de 28 m² entièrement meublé, coin cuisine équipé, salle d'eau, bureau. Immeuble gardé, à 12 minutes à pied de l'ESA.", pays: "MA", ville: "Casablanca", quartier: "Maârif", address: "Rue Abou Al Waqt, Maârif", lat: 33.5821, lng: -7.6327, rent: 3200, charges: 300, deposit: 3200, currency: "MAD", surface: 28, rooms: 1, amenities: ["wifi", "eau", "electricite", "meuble", "cuisine", "gardiennage", "bureau"], rules: "Non-fumeur. Pas de fêtes après 22 h.", minMonths: 6, availableFrom: `${year}-09-01`, nearEstablishments: [{ id: "ma-esa-casa", minutes: 12, mode: "pied" }, { id: "ma-esca", minutes: 18, mode: "transport" }], status: "publie", verification: "partenaire" },
    { landlordId: bailleur.id, title: "Chambre en colocation · Gauthier", type: "colocation", description: "Chambre privée dans un appartement de 3 chambres partagé entre étudiantes. Salon, cuisine équipée, machine à laver. Tramway à 3 minutes.", pays: "MA", ville: "Casablanca", quartier: "Gauthier", address: "Bd Zerktouni", lat: 33.5899, lng: -7.6261, rent: 2300, charges: 250, deposit: 2300, currency: "MAD", rooms: 3, capacity: 3, gender: "filles", amenities: ["wifi", "eau", "electricite", "meuble", "cuisine", "machine_a_laver"], minMonths: 3, availableFrom: `${year}-09-01`, nearEstablishments: [{ id: "ma-esa-casa", minutes: 15, mode: "transport" }, { id: "ma-um6ss", minutes: 20, mode: "transport" }], status: "publie", verification: "visite" },
  ]);
  console.log("Comptes de démonstration prêts (…demo@navigoal.com).");
}

const t0 = Date.now();
await seedRefs();
const n = await seedEstablishments();
const adminId = await seedAdmin();
await seedContent(adminId);
if (process.env.SEED_DEMO === "1") await seedDemo();
await pool.end();
console.log(`Seed terminé : ${n} établissements (${Date.now() - t0} ms).`);

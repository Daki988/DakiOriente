// Catalogue public : offres (formation × établissement × campus), villes d'études, secteurs et sélections éditoriales.
// Tout est calculé à partir des référentiels (aucun chiffre saisi à la main).
import paysOrigineData from "@/data/pays_origine.json";
import { VILLES_ETUDES, competenceById, etablissements, formationById, formations, metiers, mobilite, villesOf, type Etablissement, type Formation, type Metier } from "./data";

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const slugVille = (v: string) => norm(v).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------------------------------------------------------------- Offres et campus
/** Villes (campus) où l'établissement propose la formation. Sans précision de campus : tous ses campus. */
export function villesOffre(e: Etablissement, fid: string): string[] {
  const toutes = villesOf(e);
  if (!e.campus || toutes.length < 2) return toutes;
  const sources: (string[] | null)[] = [
    ...[...e.filieres, ...e.filieres_echues].filter((f) => f.formation === fid).map((f) => f.campus ?? (f.ville ? [f.ville] : null)),
    ...(e.site?.programmes ?? []).filter((p) => p.formation === fid).map((p) => p.campus),
  ];
  if (!sources.length || sources.some((s) => !s || !s.length)) return toutes;
  const set = new Set(sources.flat() as string[]);
  const v = toutes.filter((x) => set.has(x));
  return v.length ? v : toutes;
}

export type Offre = { f: Formation; e: Etablissement; villes: string[] };
/** Toutes les offres publiées : une par couple (formation, établissement), avec les villes où elle est dispensée. */
export const OFFRES: Offre[] = etablissements.flatMap((e) => e.formations.filter((fid) => formationById[fid]).map((fid) => ({ f: formationById[fid], e, villes: villesOffre(e, fid) })));

/** Formations proposées par au moins un établissement. */
export const FORMATIONS_OFFERTES = formations.filter((f) => f.etablissements.length > 0);

// ---------------------------------------------------------------- Villes
export type VilleInfo = { nom: string; slug: string; etabs: Etablissement[]; offres: Offre[]; photo: (typeof mobilite)[string]["couverture"] | null };
export const VILLES: VilleInfo[] = VILLES_ETUDES.map((nom) => ({
  nom, slug: slugVille(nom),
  etabs: etablissements.filter((e) => villesOf(e).includes(nom)),
  offres: OFFRES.filter((o) => o.villes.includes(nom)),
  photo: mobilite[nom]?.couverture ?? null,
})).sort((a, b) => b.etabs.length - a.etabs.length || a.nom.localeCompare(b.nom, "fr"));
export const villeBySlug = Object.fromEntries(VILLES.map((v) => [v.slug, v])) as Record<string, VilleInfo>;
export const villeHref = (nom: string) => `/villes/${slugVille(nom)}/`;

// ---------------------------------------------------------------- Chiffres réels
const paysOrigine = (paysOrigineData as unknown as { items: { continent: string }[] }).items;
export const CHIFFRES = {
  etablissements: etablissements.length,
  campus: etablissements.reduce((n, e) => n + villesOf(e).length, 0),
  filieres: etablissements.reduce((n, e) => n + e.filieres.length, 0),
  formations: FORMATIONS_OFFERTES.length,
  metiers: metiers.length,
  villes: VILLES_ETUDES.length,
  paysAfrique: paysOrigine.filter((p) => p.continent === "afrique").length,
  pays: paysOrigine.length,
};

// ---------------------------------------------------------------- Métiers : niveaux, secteurs, qualités
export const NIVEAUX_METIER: [string, string][] = [["niv-bac", "Bac"], ["niv-bac2", "Bac+2"], ["niv-bac3", "Bac+3"], ["niv-bac5", "Bac+5"], ["niv-bac7", "Bac+6/7"], ["niv-bac8", "Bac+8"]];

/** Regroupement des employeurs cités dans les fiches métiers en grands secteurs d'activité. */
export const SECTEURS: { id: string; libelle: string; re: RegExp }[] = [
  { id: "sante", libelle: "Santé et social", re: /h[oô]pita|clinique|chu|officine|sant[eé]|maternit|laborato|pharma|v[eé]t[eé]rin|services sociaux|oms/i },
  { id: "numerique", libelle: "Numérique et télécoms", re: /esn|startup|t[eé]l[eé]com|tech|e-commerce|agences digitales|op[eé]rateurs|fintech|mobile money|web|incubateur/i },
  { id: "finance", libelle: "Banque, finance et assurance", re: /banque|assurance|bourse|microfinance|fonds d'invest|caisses de retraite|big four|cabinets comptables|audit|cour des comptes|bailleurs de fonds/i },
  { id: "industrie", libelle: "Industrie, énergie et mines", re: /industri|usine|mine|mini[eè]re|p[eé]trol|[eé]nergie|[eé]lectricit|chimie|automobile|a[eé]ronautique|[eé]quipementier|garage|concessionnaire|textile|mangan|g[eé]olog|installateur|flottes/i },
  { id: "btp", libelle: "BTP, architecture et urbanisme", re: /btp|bureaux d'[eé]tudes|architect|promoteur|urbain|cadastre|travaux publics/i },
  { id: "public", libelle: "Administration et organisations", re: /administration|minist[eè]re|collectivit|[eé]tats|organisations internationales|ong|institutions|juridiction|douane|forces arm[eé]es|statistique|banques centrales|anpn|asecna|onda/i },
  { id: "conseil", libelle: "Conseil, droit et services aux entreprises", re: /cabinet|conseil|notari|entreprises|pme|services|toutes organisations|ind[eé]pendant|auto-entreprise/i },
  { id: "commerce", libelle: "Commerce, marketing et distribution", re: /distribution|marques|biens de consommation|agences|mode/i },
  { id: "education", libelle: "Éducation et recherche", re: /[eé]cole|[eé]tablissements|universit|recherche|enseignement|orientation|biblioth|[eé]tablissements scolaires|navigoal/i },
  { id: "medias", libelle: "Médias, culture et sport", re: /m[eé]dias|presse|radio|tv|cha[iî]nes|production|cr[eé]ateur|galerie|mus[eé]e|culture|clubs|f[eé]d[eé]rations/i },
  { id: "transport", libelle: "Transport et logistique", re: /logistique|port|transitaire|compagnies a[eé]riennes/i },
  { id: "agri", libelle: "Agriculture, forêt et pêche", re: /agri|agro|[eé]levage|coop[eé]rative|for[eê]t|p[eê]che|forestier/i },
  { id: "tourisme", libelle: "Tourisme et hôtellerie", re: /h[oô]tel|resort|tourisme|restaurant/i },
];
export const secteursOf = (m: Metier) => SECTEURS.filter((s) => m.secteurs.some((x) => s.re.test(x))).map((s) => s.id);

/** Qualités (compétences transversales) demandées par au moins un métier. */
export const QUALITES = Array.from(new Set(metiers.flatMap((m) => m.competences).filter((c) => competenceById[c]?.categorie === "transversale")))
  .map((id) => ({ id, libelle: competenceById[id].libelle }))
  .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

/** Nombre d'établissements qui préparent à un métier (via les formations qui y mènent). */
export const ecolesPourMetier = (m: Metier) => new Set(m.formations.flatMap((f) => formationById[f]?.etablissements ?? [])).size;

/** Sélection « à la une » : métiers auxquels préparent le plus d'établissements au Maroc (données du référentiel). */
export const METIERS_UNE = [...metiers].sort((a, b) => ecolesPourMetier(b) - ecolesPourMetier(a) || a.nom.localeCompare(b.nom, "fr")).slice(0, 5);

/** Formations proposées par le plus grand nombre d'établissements. */
export const FORMATIONS_UNE = [...FORMATIONS_OFFERTES].sort((a, b) => b.etablissements.length - a.etablissements.length || a.intitule.localeCompare(b.intitule, "fr"));

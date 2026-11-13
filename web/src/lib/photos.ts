// Photos d'illustration libres de droits (crédits : public/images/credits.json).
import credits from "../../public/images/credits.json";
import creditsMetiers from "../../public/images/credits-metiers.json";

export type Illus = { id: string; src: string; alt: string; credit: string; licence: string; page: string };
const LISTE = credits as Illus[];
export const PHOTOS = Object.fromEntries(LISTE.map((p) => [p.id, p])) as Record<string, Illus>;
export const photo = (id: string): Illus | null => PHOTOS[id] ?? null;

/** Photo représentative d'un domaine (sinon pictogramme). */
const DOMAINE: Record<string, string> = {
  "dom-numerique": "informatique", "dom-sciences": "data", "dom-sante": "sante", "dom-gestion": "gestion", "dom-finance": "finance", "dom-commerce": "commerce",
  "dom-ingenierie": "ingenierie", "dom-btp": "btp", "dom-energie-mines": "energie", "dom-droit": "droit", "dom-admin-publique": "droit", "dom-communication": "communication",
  "dom-arts-design": "design", "dom-agri-env": "agriculture", "dom-education": "education", "dom-tourisme": "tourisme", "dom-transport-logistique": "logistique",
  "dom-lettres-langues": "langues", "dom-shs": "social", "dom-securite-defense": "securite",
};
export const photoDomaine = (d: string) => photo(DOMAINE[d] ?? "") ;

/** Une photo par métier (scripts/fetch_illustrations.py, sources libres créditées) ; à défaut, celle du domaine. */
const METIERS = creditsMetiers as Record<string, { src: string; alt: string; credit: string; licence: string; page: string }>;
export const photoMetier = (id: string, domaine: string): Illus | null => {
  const m = METIERS[id];
  return m ? { id, src: m.src, alt: m.alt, credit: m.credit, licence: m.licence, page: m.page } : photoDomaine(domaine);
};

/** Image d'une offre de formation : photo de l'établissement, sinon celle du métier visé (variée), sinon le domaine.
 * `metiers` : métiers auxquels la formation prépare — évite que toutes les formations d'un domaine se ressemblent. */
export const photoFormation = (domaine: string, e?: { nom: string; photos: { src: string; credit: string | null; licence: string | null; page: string | null }[] }, metiers?: string[]): Illus | null => {
  const ph = e?.photos[0];
  if (ph) return { id: ph.src, src: ph.src, alt: e!.nom, credit: ph.credit ?? e!.nom, licence: ph.licence ?? "", page: ph.page ?? "" };
  const m = (metiers ?? []).find((x) => METIERS[x]);
  return m ? photoMetier(m, domaine) : photoDomaine(domaine);
};

// Photos d'illustration libres de droits (crédits : public/images/credits.json).
import credits from "../../public/images/credits.json";

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

/** Photos propres à certains métiers ; à défaut, celle du domaine. */
const METIER: Record<string, string> = {
  "met-medecin-generaliste": "medecin", "met-infirmier": "infirmier", "met-developpeur-web-mobile": "informatique", "met-data-analyst": "data",
  "met-ingenieur-genie-civil": "btp", "met-ingenieur-agronome": "agriculture", "met-avocat": "droit", "met-journaliste": "communication",
  "met-enseignant-secondaire": "education", "met-instituteur": "education", "met-data-scientist": "data",
};
export const photoMetier = (id: string, domaine: string) => photo(METIER[id] ?? "") ?? photoDomaine(domaine);

/** Image d'une offre de formation : photo de l'établissement si elle existe, sinon celle du domaine. */
export const photoFormation = (domaine: string, e?: { nom: string; photos: { src: string; credit: string | null; licence: string | null; page: string | null }[] }): Illus | null => {
  const ph = e?.photos[0];
  return ph ? { id: ph.src, src: ph.src, alt: e!.nom, credit: ph.credit ?? e!.nom, licence: ph.licence ?? "", page: ph.page ?? "" } : photoDomaine(domaine);
};

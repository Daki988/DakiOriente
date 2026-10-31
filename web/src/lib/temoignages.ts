import temoignagesData from "@/data/temoignages.json";
import { metierById } from "@/lib/data";

// Témoignages réels de professionnels (maquettes « temoignages ») : résumé rédigé par Navigoal, courte citation exacte,
// lien vers l'original. Référentiel : data/referentiels/temoignages.json.
export type Temoignage = {
  id: string; metier: string; personne: string; role: string; lieu: string;
  type: "article" | "video" | "radio" | "podcast"; media: string; date: string | null; url: string; citation: string | null; resume: string;
  /** Lecteur officiel intégrable (YouTube sans cookies, Onisep TV), lu sur Navigoal au clic. */
  video: string | null;
};

export const temoignages = temoignagesData as Temoignage[];

export const temoignagesDuMetier = (id: string) => temoignages.filter((t) => t.metier === id);

/** Témoignages d'autres métiers du même domaine, pour compléter l'encart d'une fiche métier. */
export const temoignagesDuDomaine = (id: string, n = 3) => {
  const d = metierById[id]?.domaine;
  const vus = new Set<string>();
  return temoignages.filter((t) => t.metier !== id && metierById[t.metier]?.domaine === d && !vus.has(t.metier) && vus.add(t.metier)).slice(0, n);
};

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const dateTemoignage = (d: string | null) => (d ? `${MOIS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : null);
export const initiales = (n: string) => n.replace(/^(Dr|Me|Capitaine)\s+/, "").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
export { plateforme } from "@/lib/plateforme-video";

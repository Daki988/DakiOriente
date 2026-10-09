// Pays d'origine des étudiants (destination unique : le Maroc) — référentiel data/referentiels/pays_origine.json.
import data from "@/data/pays_origine.json";

export type Visa = "national" | "dispense" | "evisa" | "visa" | null;
export type PaysOrigine = {
  id: string; nom: string; region: string; continent: "afrique" | "autre"; indicatif: string; devise: string;
  visa: Visa; aevm: boolean; evisa_conditionnel: boolean; diplome: string | null; systeme: string | null; note: string | null; sejour: string | null;
};
const D = data as unknown as { regions: Record<string, string>; visa: Record<string, string>; avertissement: string; items: PaysOrigine[] };

export const paysOrigine = D.items;
export const REGIONS = D.regions;
export const VISA_LABEL = D.visa;
export const VISA_AVERTISSEMENT = D.avertissement;
export const paysOrigineById = Object.fromEntries(D.items.map((p) => [p.id, p])) as Record<string, PaysOrigine>;
export const isCountryCode = (c: string) => c in paysOrigineById;
export const nomPays = (c?: string | null) => (c ? paysOrigineById[c]?.nom ?? c : "");

/** Options de liste déroulante : l'Afrique d'abord, puis les autres pays. */
export const PAYS_OPTIONS: { value: string; label: string; group: string }[] = D.items.map((p) => ({ value: p.id, label: p.nom, group: p.continent === "afrique" ? "Afrique" : "Autres pays" }));

/** Texte court du régime d'entrée au Maroc pour un pays. */
export function visaResume(c: string): string {
  const p = paysOrigineById[c];
  if (!p) return "";
  if (p.visa === "national") return "Aucune formalité (ressortissant marocain)";
  if (p.visa === "dispense") return p.aevm ? "Sans visa, avec autorisation électronique (AEVM) avant le départ" : "Sans visa (jusqu'à 90 jours), puis carte de séjour étudiant";
  if (p.visa === "evisa") return "e-Visa à demander en ligne (acces-maroc.ma), puis carte de séjour étudiant";
  if (p.visa === "visa") return p.evisa_conditionnel ? "Visa consulaire (e-Visa possible avec un visa Schengen, US, UK… valide), puis carte de séjour" : "Visa consulaire auprès de l'ambassade du Maroc, puis carte de séjour";
  return "À vérifier auprès du consulat du Maroc";
}

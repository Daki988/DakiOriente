// Bourses et réductions annoncées par les écoles sur leur site officiel (rubrique « bourses » relevée lors de la
// collecte des sites, champ site.bourses du référentiel). Lu côté serveur seulement (détail des établissements).
import { etablissements, type Etablissement } from "@/lib/data";
import { etabDetail } from "@/lib/etab-detail";

export type Categorie = "cent" | "merite" | "sociale" | "pret" | "reduction";
export type BourseEcole = { logo: Etablissement["logo"]; id: string; sigle: string; nom: string; ville: string; texte: string; categories: Categorie[]; badge: string | null; detaille: boolean; releve: string | null };

const pourcents = (t: string) => [...t.matchAll(/(\d{1,3})\s?%/g)].map((m) => Number(m[1])).filter((n) => n > 0 && n <= 100);

/** Badge court : fourchette de prise en charge (« 25 à 100 % »), « 100 % », ou critère (« Dès 15/20 »). */
function badge(t: string): string | null {
  const p = pourcents(t);
  const complet = /totalit|scolarité complète|bourses? complètes?|intégral|100\s?%/i.test(t);
  if (p.length >= 2 && Math.min(...p) < Math.max(...p)) return `${Math.min(...p)} à ${Math.max(...p)} %`;
  if (complet) return /partiel|partie/i.test(t) ? "Jusqu'à 100 %" : "100 %";
  if (p.length === 1) return `${p[0]} %`;
  const note = /(\d{2})\s?\/\s?20/.exec(t);
  if (note) return `Dès ${note[1]}/20`;
  return null;
}

export function boursesDesEcoles(): BourseEcole[] {
  const liste: BourseEcole[] = [];
  for (const e of etablissements) {
    const d = etabDetail(e.id);
    const t = d?.site?.bourses?.trim();
    if (!t) continue;
    const categories: Categorie[] = [];
    if (/totalit|complète|intégral|100\s?%/i.test(t)) categories.push("cent");
    if (/mérite|excellence|méritant|mention/i.test(t)) categories.push("merite");
    if (/social|sociaux|difficulté|ressources|situation (financière|socio)|revenus/i.test(t)) categories.push("sociale");
    if (/prêt|emprunt|crédit|banque/i.test(t)) categories.push("pret");
    if (/réduction|remise|exonération|dispense|early|fratrie|paiement intégral/i.test(t)) categories.push("reduction");
    liste.push({ logo: e.logo, id: e.id, sigle: e.sigle || e.nom, nom: e.nom, ville: e.ville.split("/")[0].trim(), texte: t, categories, badge: badge(t), detaille: !/sans détail|non relevé|détails? non/i.test(t), releve: d?.site?.date ?? null });
  }
  // Les plus généreuses d'abord : 100 %, puis le nombre de critères, puis l'ordre alphabétique.
  return liste.sort((a, b) => Number(b.categories.includes("cent")) - Number(a.categories.includes("cent")) || Number(b.detaille) - Number(a.detaille) || b.texte.length - a.texte.length);
}

// Tests de qualité de Navi : contrôles automatiques d'une réponse (outils, longueur, contenu attendu ou interdit, routage).
// Le juge (modèle) et l'exécution sont dans scripts/navi-evals.mts ; les cas dans scripts/navi-evals/cas.json.
export type Cas = {
  id: string;
  sujet: string;
  messages: { role: "user" | "assistant"; texte: string }[];
  connecte?: boolean;
  destination?: string;
  pays?: string;
  attentes: {
    outilsUnDe?: string[]; // au moins un de ces outils doit être appelé
    sansOutil?: boolean; // aucune recherche attendue
    motsMax?: number;
    contient?: string[]; // expressions régulières (insensibles à la casse) qui doivent toutes apparaître
    interdit?: string[]; // expressions régulières qui ne doivent pas apparaître
    cartes?: boolean;
    route?: "simple" | "complet";
  };
  criteres: string; // ce que le juge vérifie, en langage clair
};
export type Sortie = { reponse: string; outils: string[]; cartes: number; route: string; statut: string };

const ANNONCES = /\b(je (cherche|regarde|vérifie|consulte)|laisse-moi (chercher|regarder)|un instant)\b/i;
export const compterMots = (s: string) => s.replace(/[*#>-]/g, " ").split(/\s+/).filter(Boolean).length;

/** Contrôles automatiques : liste des manquements (vide = réussi). Le routage est mesuré à part. */
export function controler(c: Cas, s: Sortie): string[] {
  const a = c.attentes, k: string[] = [];
  if (!s.reponse.trim()) k.push("aucune réponse affichée");
  if (s.statut !== "ok") k.push(`statut ${s.statut}`);
  if (a.outilsUnDe && !a.outilsUnDe.some((o) => s.outils.includes(o))) k.push(`aucun des outils attendus (${a.outilsUnDe.join(", ")})`);
  if (a.sansOutil && s.outils.some((o) => o !== "afficher" && o !== "condensation")) k.push(`recherche inutile (${s.outils.join(", ")})`);
  if (a.motsMax && compterMots(s.reponse) > a.motsMax) k.push(`trop long (${compterMots(s.reponse)} mots > ${a.motsMax})`);
  for (const r of a.contient ?? []) if (!new RegExp(r, "i").test(s.reponse)) k.push(`attendu : /${r}/`);
  for (const r of a.interdit ?? []) if (new RegExp(r, "i").test(s.reponse)) k.push(`interdit : /${r}/`);
  if (a.cartes && !s.cartes) k.push("aucune carte affichée");
  // Annonce = la réponse commence par « je cherche… » (une proposition en fin de réponse, « je regarde avec toi », est permise).
  if (ANNONCES.test(s.reponse.trim().slice(0, 40))) k.push("annonce son travail au lieu de répondre");
  return k;
}

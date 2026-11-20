/**
 * Recherche dans les textes du site (couche « RAG » de Navi).
 *
 * Le corpus (src/data/documents.json) est produit par scripts/index-documents.mjs à partir du HTML
 * pré-rendu : conditions d'utilisation, confidentialité, page Parents, ressources (visa, budget,
 * logement, checklist de candidature, labels), fonctionnement de Navilease et de NaviTravel,
 * « Pourquoi Navigoal », témoignages. Le catalogue (écoles, villes, métiers, formations) en est
 * exclu : Navi l'interroge par ses outils, avec des données structurées et à jour.
 *
 * Classement BM25 : les mots rares pèsent plus que les mots courants, et un passage court qui
 * répond vaut mieux qu'un passage long qui effleure. Aucun service externe, aucun embedding à
 * payer : le corpus tient en 350 passages, la recherche se fait en mémoire en moins d'une milliseconde.
 */
import corpus from "@/data/documents.json";

export type Passage = { chemin: string; titre: string; section: string; texte: string };
const DOCS = corpus as Passage[];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VIDES = new Set(["de", "des", "du", "la", "le", "les", "l", "d", "en", "et", "a", "au", "aux", "un", "une",
  "pour", "je", "tu", "il", "on", "que", "qui", "quoi", "est", "sont", "ce", "ces", "mon", "ma", "mes", "ton", "ta",
  "tes", "son", "sa", "ses", "dans", "sur", "par", "avec", "plus", "pas", "ne", "si", "comme", "quel", "quelle",
  "quels", "quelles", "comment", "combien", "est-ce", "y", "faut", "il", "elle", "nous", "vous", "ils", "elles"]);
const mots = (t: string) => norm(t).split(/[^a-z0-9+]+/).filter((m) => m.length > 2 && !VIDES.has(m));

/** Index inversé et longueurs, calculés une seule fois au premier appel. */
let index: { df: Map<string, number>; sacs: Map<string, number>[]; longueurs: number[]; moyenne: number } | null = null;
function construire() {
  if (index) return index;
  const sacs: Map<string, number>[] = [];
  const df = new Map<string, number>();
  const longueurs: number[] = [];
  for (const d of DOCS) {
    const sac = new Map<string, number>();
    const ms = mots(`${d.titre} ${d.section} ${d.texte}`);
    for (const m of ms) sac.set(m, (sac.get(m) ?? 0) + 1);
    for (const m of sac.keys()) df.set(m, (df.get(m) ?? 0) + 1);
    sacs.push(sac);
    longueurs.push(ms.length || 1);
  }
  index = { df, sacs, longueurs, moyenne: longueurs.reduce((a, b) => a + b, 0) / (longueurs.length || 1) };
  return index;
}

const K1 = 1.4;
const B = 0.72;

/** Passages les plus proches de la question, du plus pertinent au moins pertinent. */
export function chercherDocuments(question: string, limite = 4): (Passage & { page: string })[] {
  const { df, sacs, longueurs, moyenne } = construire();
  const q = [...new Set(mots(question))];
  if (!q.length) return [];
  const N = DOCS.length;
  const notes = sacs.map((sac, i) => {
    let s = 0;
    for (const m of q) {
      const f = sac.get(m);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(m) ?? 0) + 0.5) / ((df.get(m) ?? 0) + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * longueurs[i]) / moyenne)));
    }
    // Un mot de la question présent dans le titre de section est un signal fort.
    const t = norm(`${DOCS[i].titre} ${DOCS[i].section}`);
    s += 0.6 * q.filter((m) => t.includes(m)).length;
    return { i, s };
  });
  return notes
    .filter((x) => x.s > 1.2)
    .sort((a, b) => b.s - a.s)
    .slice(0, Math.max(1, Math.min(limite, 6)))
    .map(({ i }) => ({ ...DOCS[i], page: DOCS[i].chemin }));
}

export const nombreDePassages = () => DOCS.length;

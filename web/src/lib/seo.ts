// Longueurs conseillées pour les résultats Google : au-delà, le titre ou la description est coupé.
// Titre : 60 caractères, suffixe « · Navigoal » compris (ajouté par le modèle du layout). Description : 70 à 155.
export const SUFFIXE = " · Navigoal";
export const MAX_TITRE = 60;
export const MAX_DESCRIPTION = 155;

const long = (s: string) => [...s].length;

/** Coupe sur un mot, sans laisser de ponctuation pendante, et ajoute « … ». */
export function couper(s: string, max: number) {
  if (long(s) <= max) return s;
  const t = [...s].slice(0, max - 1).join("");
  const coupe = t.slice(0, Math.max(t.lastIndexOf(" "), Math.floor(max * 0.6)));
  return coupe.replace(/[\s,;:·–—-]+$/u, "") + "…";
}

/** Premier titre candidat qui tient avec le suffixe ; à défaut, le dernier, coupé. */
export function titreSeo(...candidats: (string | null | undefined | false)[]) {
  const c = candidats.filter((x): x is string => !!x);
  const max = MAX_TITRE - long(SUFFIXE);
  return c.find((x) => long(x) <= max) ?? couper(c[c.length - 1] ?? "Navigoal", max);
}

/** Première description candidate de longueur conseillée ; à défaut, la dernière, coupée. */
export function descriptionSeo(...candidats: (string | null | undefined | false)[]) {
  const c = candidats.filter((x): x is string => !!x).map((x) => x.replace(/\s+/g, " ").trim());
  return c.find((x) => long(x) <= MAX_DESCRIPTION) ?? couper(c[c.length - 1] ?? "", MAX_DESCRIPTION);
}

const mots = (s: string) => s.trim().split(/\s+/).length;

/**
 * Versions de plus en plus courtes d'un intitulé, sans le couper au milieu :
 * sans parenthèses, avant le dernier puis le premier « / », avant le dernier « et ».
 * Ex. « Diplôme d'ingénieur en informatique / génie logiciel » → « Diplôme d'ingénieur en informatique ».
 */
export function variantesNom(nom: string) {
  const v = [nom];
  const sansPar = nom.replace(/\s*\([^)]*\)?/g, "").trim();
  v.push(sansPar);
  const i = sansPar.lastIndexOf(" / "), j = sansPar.indexOf(" / ");
  if (i > 0 && mots(sansPar.slice(0, i)) >= 3) v.push(sansPar.slice(0, i));
  if (j > 0 && mots(sansPar.slice(0, j)) >= 3) v.push(sansPar.slice(0, j));
  const apresBarre = sansPar.slice(i + 3);
  if (i > 0 && mots(apresBarre) >= 3) v.push(apresBarre.charAt(0).toUpperCase() + apresBarre.slice(1));
  const base = v[v.length - 1];
  const k = base.lastIndexOf(" et ");
  if (k > 0 && mots(base.slice(0, k)) >= 3) v.push(base.slice(0, k).replace(/,\s*[^,]*$/, (m) => (mots(base.slice(0, k)) > 4 ? "" : m)));
  return [...new Set(v.map((x) => x.replace(/[\s,;:·–-]+$/u, "")))];
}

/** Titre éditorial (article, guide) : entier, sinon sa partie avant ou après « : ». */
export function titreEditorial(t: string) {
  const [avant, ...reste] = t.split(" : ");
  const apres = reste.join(" : ");
  const courts = mots(avant) >= 3 ? variantesNom(avant).filter((x) => mots(x) >= 3) : [];
  // Sans « : » : avant la première virgule, puis avant le dernier « en » (« … de l'éducation en Afrique »).
  const v = t.indexOf(", "), e = t.lastIndexOf(" en ");
  if (v > 0 && mots(t.slice(0, v)) >= 4) courts.push(t.slice(0, v));
  if (e > 0 && mots(t.slice(0, e)) >= 4) courts.push(t.slice(0, e));
  // Dernier recours avant de couper : abréviations courantes.
  const abr = (x: string) => { const r = x.replace(/l'intelligence artificielle/gi, "l'IA").replace(/intelligence artificielle/gi, "IA"); return r.charAt(0).toUpperCase() + r.slice(1); };
  return titreSeo(t, ...courts, apres && mots(apres) >= 4 && apres.charAt(0).toUpperCase() + apres.slice(1), abr(t), ...courts.map(abr), t);
}

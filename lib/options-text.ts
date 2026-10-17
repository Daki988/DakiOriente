import type { ProductOption } from "./pricing.ts";

/**
 * Options produit écrites en texte, une option par ligne :
 *   Pelliculage : Mat | Brillant | Soft touch +20
 *   Impression : Recto-verso | Recto seul -10
 * Le nombre final (optionnel) est un supplément en % du prix de base.
 */
export function optionsToText(options: ProductOption[]): string {
  return options
    .map((o) => `${o.name} : ${o.choices.map((c) => (c.pct ? `${c.label} ${c.pct > 0 ? "+" : ""}${c.pct}` : c.label)).join(" | ")}`)
    .join("\n");
}

export function textToOptions(text: string): ProductOption[] | string {
  const out: ProductOption[] = [];
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep < 1) return `Ligne ${i + 1} : écrivez « Nom : choix 1 | choix 2 ».`;
    const name = line.slice(0, sep).trim();
    const choices = line.slice(sep + 1).split("|").map((c) => c.trim()).filter(Boolean).map((c) => {
      const m = c.match(/^(.*?)\s+([+-]\d{1,3})\s*%?$/);
      return m ? { label: m[1].trim(), pct: Number(m[2]) } : { label: c, pct: 0 };
    });
    if (!choices.length) return `Ligne ${i + 1} : ajoutez au moins un choix.`;
    if (choices.some((c) => c.pct < -90 || c.pct > 300)) return `Ligne ${i + 1} : supplément entre -90 et +300 %.`;
    out.push({ name, choices });
  }
  return out;
}

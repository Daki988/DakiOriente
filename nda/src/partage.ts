import { formaterAdresse } from "./adresse.ts";
import type { Adresse } from "./types.ts";

/** URL publique de la fiche adresse (à adapter au domaine final). */
export function lienFiche(a: Adresse, base = "https://nda.ga"): string {
  return `${base}/${a.code}`;
}

export function lienItineraire(a: Adresse): string {
  const { lat, lon } = a.position;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

export function texteWhatsApp(a: Adresse, base?: string): string {
  return [
    "📍 Mon adresse",
    ...formaterAdresse(a),
    a.repere ? `Repère : ${a.repere}` : null,
    `Code Nda : ${a.code}`,
    lienFiche(a, base),
  ]
    .filter(Boolean)
    .join("\n");
}

export function lienWhatsApp(a: Adresse, base?: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texteWhatsApp(a, base))}`;
}

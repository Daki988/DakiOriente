import { settings } from "@/lib/content";

/** Bandeau affiché tant que `demoMode` est actif dans les paramètres (à désactiver avant la mise en ligne). */
export function DemoBanner() {
  if (!settings.demoMode) return null;
  return (
    <div className="relative z-50 bg-gold px-4 py-1.5 text-center text-[11px] font-semibold text-accent-ink">
      Aperçu de démonstration — prix, horaires, numéros et événements sont provisoires.
    </div>
  );
}

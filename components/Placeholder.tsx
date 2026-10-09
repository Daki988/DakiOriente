import { CactusMark } from "./Logo";

/**
 * Visuel de substitution tant que les vraies photos ne sont pas fournies.
 * TODO: DONNÉE À CONFIRMER — remplacer par les photos/vidéos réelles via l'administration.
 * Aucune image de banque d'images n'est utilisée volontairement.
 */
const moods: Record<string, string> = {
  early: "radial-gradient(120% 90% at 20% 10%, #c98a3a55 0%, transparent 55%), radial-gradient(90% 80% at 90% 100%, #0e3a2ccc 0%, transparent 60%), linear-gradient(160deg,#1b1610,#0d100e)",
  late: "radial-gradient(90% 70% at 70% 0%, #8cc63f55 0%, transparent 55%), radial-gradient(80% 70% at 0% 100%, #2b1a5a99 0%, transparent 60%), linear-gradient(200deg,#07120d,#050605)",
  food: "radial-gradient(100% 80% at 50% 30%, #d2a84e44 0%, transparent 55%), linear-gradient(170deg,#1d140c,#0b0a08)",
  team: "radial-gradient(100% 80% at 30% 20%, #0e3a2cdd 0%, transparent 60%), linear-gradient(170deg,#101a15,#070908)",
};

export function Placeholder({
  mood = "late", label, className = "", showLabel = true,
}: { mood?: string; label: string; className?: string; showLabel?: boolean }) {
  return (
    <div
      role="img"
      aria-label={`${label} (visuel provisoire)`}
      className={`grain wood relative overflow-hidden ${className}`}
      style={{ backgroundImage: moods[mood] ?? moods.late }}
    >
      <CactusMark className="absolute -bottom-6 -right-4 h-40 w-40 text-white/[0.04]" />
      {showLabel && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/70 backdrop-blur">
          Photo à venir · {label}
        </span>
      )}
    </div>
  );
}

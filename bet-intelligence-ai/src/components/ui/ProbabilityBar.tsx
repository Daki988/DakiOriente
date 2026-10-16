import { formatPct } from '../../utils/format';

/** Barre de probabilité avec repère de la probabilité implicite (facultatif). */
export function ProbabilityBar({ value, implied, label }: { value: number; implied?: number; label?: string }) {
  const tone = value >= 0.75 ? 'bg-good' : value >= 0.55 ? 'bg-warn' : 'bg-risk';
  return (
    <div className="w-full" aria-label={label ?? `Probabilité estimée ${formatPct(value)}`}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel-3">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
        {implied != null && (
          <div className="absolute top-[-2px] h-[10px] w-0.5 bg-ink" style={{ left: `${Math.min(100, implied * 100)}%` }} title={`Implicite ${formatPct(implied)}`} />
        )}
      </div>
    </div>
  );
}

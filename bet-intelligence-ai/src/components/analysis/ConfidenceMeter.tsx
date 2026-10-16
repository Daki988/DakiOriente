import { Gauge } from 'lucide-react';
import type { MatchAnalysis } from '../../services/analysisService';

export function ConfidenceMeter({ confidence }: { confidence: MatchAnalysis['confidence'] }) {
  const tone = confidence.level === 'ÉLEVÉ' ? 'text-good bg-good' : confidence.level === 'MODÉRÉ' ? 'text-warn bg-warn' : 'text-risk bg-risk';
  const [text, bar] = tone.split(' ');
  return (
    <div className="rounded-xl border border-line bg-night-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2"><Gauge size={14} aria-hidden /> Niveau de confiance du moteur démo</p>
        <p className={`text-sm font-bold ${text}`}>{confidence.level}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={confidence.score} aria-label="Indice de confiance">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${confidence.score}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{confidence.explanation}</p>
    </div>
  );
}

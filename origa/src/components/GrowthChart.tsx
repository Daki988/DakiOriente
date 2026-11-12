import { refWeight } from '../data/seed';
import type { Weighing } from '../domain/types';
import { daysBetween } from '../domain/ids';
import { useDesktop } from '../app/hooks';

/** Courbe de croissance : pesées réelles comparées à la courbe de référence de la souche (§ 5.1, GMQ). */
export function GrowthChart({ placedAt, initialWeightG, weighings, days, wide }: { placedAt: string; initialWeightG: number; weighings: Weighing[]; days: number; wide?: boolean }) {
  const desktop = useDesktop();
  if (wide === undefined) wide = desktop;
  // Version large (ordinateur) : même taille de texte, zone de tracé plus étendue.
  const W = wide ? 620 : 320, H = wide ? 220 : 160, pad = wide ? 40 : 28, fs = wide ? 12 : 9;
  const maxD = Math.max(days, 7);
  const pts = [{ d: 0, w: initialWeightG }, ...weighings.map((w) => ({ d: daysBetween(placedAt, w.date), w: w.avgWeightG }))].sort((a, b) => a.d - b.d);
  const maxW = Math.max(refWeight(maxD), ...pts.map((p) => p.w)) * 1.08;
  const x = (d: number) => pad + (d / maxD) * (W - pad - 8);
  const y = (w: number) => H - pad + 6 - (w / maxW) * (H - pad - 4);
  const ref = Array.from({ length: maxD + 1 }, (_, d) => `${x(d)},${y(refWeight(d))}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Courbe de croissance comparée à la référence" style={{ width: '100%', height: 'auto', maxWidth: wide ? 760 : undefined, alignSelf: 'center' }}>
      {[0, 0.5, 1].map((t) => <line key={t} x1={pad} x2={W - 8} y1={y(maxW * t * 0.92)} y2={y(maxW * t * 0.92)} stroke="#E3E9E6" />)}
      {[0, 0.5, 1].map((t) => <text key={'l' + t} x={pad - 4} y={y(maxW * t * 0.92) + 3} fontSize={fs} textAnchor="end" fill="#8A9A93">{Math.round(maxW * t * 0.92)}</text>)}
      <polyline points={ref} fill="none" stroke="#B9C9C1" strokeWidth="2" strokeDasharray="5 4" />
      <polyline points={pts.map((p) => `${x(p.d)},${y(p.w)}`).join(' ')} fill="none" stroke="#12805C" strokeWidth="3" strokeLinejoin="round" />
      {pts.map((p) => <circle key={p.d} cx={x(p.d)} cy={y(p.w)} r="3.5" fill="#12805C" />)}
      <text x={W - 8} y={H - 6} fontSize={fs} textAnchor="end" fill="#8A9A93">jours</text>
      <text x={pad + 4} y={12} fontSize={fs} fill="#12805C" fontWeight="700">— pesées (g)</text>
      <text x={pad + (wide ? 120 : 90)} y={12} fontSize={fs} fill="#8A9A93">- - référence de la souche</text>
    </svg>
  );
}

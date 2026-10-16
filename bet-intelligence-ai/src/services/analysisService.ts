/**
 * « Analyse » de démonstration : textes pré-rédigés, sélectionnés par des règles
 * déterministes à partir des statistiques simulées. Aucun modèle d'IA n'est utilisé.
 */
import type { Match, MarketOffer } from '../types';
import { formatNumber, formatPct } from '../utils/format';
import { marketLabel } from '../utils/markets';
import { impliedProbability } from '../utils/math';
import { expectedGoals } from './demoEngine';

export type ConfidenceLevel = 'ÉLEVÉ' | 'MODÉRÉ' | 'FAIBLE';

export interface MatchAnalysis {
  summary: string;
  xg: { home: number; away: number; total: number };
  arguments: string[];
  risks: string[];
  confidence: { level: ConfidenceLevel; score: number; explanation: string };
  bestMarket: MarketOffer;
  valueMarkets: { offer: MarketOffer; implied: number; edge: number }[];
}

function formPoints(m: Match['homeStats']): number {
  return m.recent.reduce((a, r) => a + (r.result === 'W' ? 3 : r.result === 'D' ? 1 : 0), 0);
}

export function analyzeMatch(match: Match): MatchAnalysis {
  const xgRaw = expectedGoals(match.home.id, match.away.id);
  const xg = { home: xgRaw.home, away: xgRaw.away, total: xgRaw.home + xgRaw.away };
  const h = match.homeStats;
  const a = match.awayStats;
  const p = Object.fromEntries(match.markets.map((o) => [o.market, o.probability])) as Record<string, number>;
  const diff = xg.home - xg.away;

  const favourite =
    diff > 0.45 ? match.home.name : diff < -0.45 ? match.away.name : null;
  const tempo = xg.total >= 3 ? 'ouverte et prolifique' : xg.total <= 2.2 ? 'fermée, avec peu d’occasions attendues' : 'au rythme modéré';
  const summary = favourite
    ? `Selon le moteur de démonstration, ${favourite} part favori de cette rencontre simulée, qui s’annonce ${tempo} (${formatNumber(xg.total)} buts attendus au total).`
    : `Le moteur de démonstration ne dégage pas de favori net : rencontre simulée équilibrée et ${tempo} (${formatNumber(xg.total)} buts attendus au total).`;

  const args: string[] = [];
  const risks: string[] = [];

  if (h.xgFor >= 1.8) args.push(`${match.home.name} produit ${formatNumber(h.xgFor)} xG simulés par match à domicile.`);
  if (a.xgAgainst >= 1.6) args.push(`${match.away.name} concède ${formatNumber(a.xgAgainst)} xG simulés par match à l’extérieur.`);
  if (a.xgFor >= 1.6) args.push(`${match.away.name} reste dangereux en déplacement (${formatNumber(a.xgFor)} xG simulés).`);
  if (h.cleanSheetPct >= 35) args.push(`${match.home.name} garde sa cage inviolée dans ${h.cleanSheetPct} % des matchs simulés.`);
  const hf = formPoints(h);
  const af = formPoints(a);
  if (hf >= 10) args.push(`Bonne dynamique simulée de ${match.home.name} : ${hf} points sur les 5 derniers matchs.`);
  if (af >= 10) args.push(`Bonne dynamique simulée de ${match.away.name} : ${af} points sur les 5 derniers matchs.`);
  if (p.OVER_1_5 >= 0.75) args.push(`Plus de 1,5 but estimé à ${formatPct(p.OVER_1_5)}.`);
  if (args.length === 0) args.push('Aucun argument statistique marquant ne se dégage de l’échantillon simulé.');

  if (match.dataQuality !== 'HIGH') risks.push(`Qualité des données ${match.dataQuality === 'LOW' ? 'faible' : 'moyenne'} (${match.sampleSize} matchs dans l’échantillon simulé).`);
  if (Math.abs(diff) < 0.3) risks.push('Rapport de force serré : le match nul reste une issue crédible.');
  if (hf <= 5) risks.push(`Forme récente simulée fragile pour ${match.home.name} (${hf} points sur 15).`);
  if (af <= 5) risks.push(`Forme récente simulée fragile pour ${match.away.name} (${af} points sur 15).`);
  if (a.xgFor >= 1.4 && diff > 0) risks.push(`${match.away.name} peut punir en contre : ${formatNumber(a.xgFor)} xG simulés à l’extérieur.`);
  risks.push('Facteurs non modélisés : compositions, blessures, météo, enjeu sportif, arbitrage.');

  const sorted = [...match.markets].sort((x, y) => y.probability - x.probability);
  const valueMarkets = match.markets
    .map((offer) => {
      const implied = impliedProbability(offer.odds);
      return { offer, implied, edge: offer.probability - implied };
    })
    .sort((x, y) => y.edge - x.edge);

  // Confiance : qualité des données, taille d'échantillon, netteté du rapport de force.
  const qualityScore = match.dataQuality === 'HIGH' ? 45 : match.dataQuality === 'MEDIUM' ? 28 : 10;
  const sampleScore = Math.min(25, match.sampleSize * 1.4);
  const clarityScore = Math.min(30, Math.abs(diff) * 30);
  const score = Math.round(qualityScore + sampleScore + clarityScore);
  const level: ConfidenceLevel = score >= 75 ? 'ÉLEVÉ' : score >= 50 ? 'MODÉRÉ' : 'FAIBLE';
  const explanation = `Indice ${score}/100 calculé à partir de la qualité des données, de la taille de l’échantillon (${match.sampleSize} matchs) et de la netteté du rapport de force. Meilleur marché estimé : ${marketLabel(sorted[0].market)} (${formatPct(sorted[0].probability)}).`;

  return {
    summary,
    xg,
    arguments: args,
    risks,
    confidence: { level, score, explanation },
    bestMarket: sorted[0],
    valueMarkets,
  };
}

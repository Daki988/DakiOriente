/**
 * « Analyse » de démonstration : textes pré-rédigés, sélectionnés par des règles
 * déterministes à partir des statistiques simulées. Aucun modèle d'IA n'est utilisé.
 */
import type { Match, MarketOffer } from '../types';
import { formatNumber, formatPct } from '../utils/format';
import { marketLabel } from '../utils/markets';
import { impliedProbability } from '../utils/math';

export type ConfidenceLevel = 'ÉLEVÉ' | 'MODÉRÉ' | 'FAIBLE';

export interface MatchAnalysis {
  summary: string;
  xg: { home: number; away: number; total: number };
  arguments: string[];
  risks: string[];
  confidence: { level: ConfidenceLevel; score: number; explanation: string };
  /** null quand aucune cote n'est disponible pour ce match. */
  bestMarket: MarketOffer | null;
  valueMarkets: { offer: MarketOffer; implied: number; edge: number }[];
}

function formPoints(m: Match['homeStats']): number {
  return m.recent.reduce((a, r) => a + (r.result === 'W' ? 3 : r.result === 'D' ? 1 : 0), 0);
}

export function analyzeMatch(match: Match): MatchAnalysis {
  const live = match.source === 'live';
  const sim = live ? '' : ' simulé';
  const sims = live ? '' : ' simulés';
  const xg = { home: match.expectedGoals.home, away: match.expectedGoals.away, total: match.expectedGoals.home + match.expectedGoals.away };
  const engine = live ? 'le modèle statistique' : 'le moteur de démonstration';
  const kind = live ? 'rencontre' : 'rencontre simulée';
  const h = match.homeStats;
  const a = match.awayStats;
  const p = Object.fromEntries(match.markets.map((o) => [o.market, o.probability])) as Record<string, number>;
  const diff = xg.home - xg.away;

  const favourite =
    diff > 0.45 ? match.home.name : diff < -0.45 ? match.away.name : null;
  const tempo = xg.total >= 3 ? 'ouverte et prolifique' : xg.total <= 2.2 ? 'fermée, avec peu d’occasions attendues' : 'au rythme modéré';
  const summary = favourite
    ? `Selon ${engine}, ${favourite} part favori de cette ${kind}, qui s’annonce ${tempo} (${formatNumber(xg.total)} buts attendus au total).`
    : `${engine.charAt(0).toUpperCase()}${engine.slice(1)} ne dégage pas de favori net : ${kind} équilibrée et ${tempo} (${formatNumber(xg.total)} buts attendus au total).`;

  const args: string[] = [];
  const risks: string[] = [];

  // Production offensive : xG si disponibles (démo), sinon buts réels.
  const hAtt = h.xgFor ?? h.goalsScoredAvg;
  const aDef = a.xgAgainst ?? a.goalsConcededAvg;
  const aAtt = a.xgFor ?? a.goalsScoredAvg;
  const unit = h.xgFor != null ? `xG${sims}` : 'buts';
  if (hAtt >= 1.8) args.push(`${match.home.name} produit ${formatNumber(hAtt)} ${unit} par match à domicile.`);
  if (aDef >= 1.6) args.push(`${match.away.name} concède ${formatNumber(aDef)} ${unit} par match à l’extérieur.`);
  if (aAtt >= 1.6) args.push(`${match.away.name} reste dangereux en déplacement (${formatNumber(aAtt)} ${unit} par match).`);
  if (h.cleanSheetPct != null && h.cleanSheetPct >= 35) args.push(`${match.home.name} garde sa cage inviolée dans ${h.cleanSheetPct} % de ses matchs à domicile${live ? '' : ' simulés'}.`);
  const hf = formPoints(h);
  const af = formPoints(a);
  if (hf >= 10) args.push(`Bonne dynamique${sim === '' ? '' : ' simulée'} de ${match.home.name} : ${hf} points sur les 5 derniers matchs.`);
  if (af >= 10) args.push(`Bonne dynamique${sim === '' ? '' : ' simulée'} de ${match.away.name} : ${af} points sur les 5 derniers matchs.`);
  if ((p.OVER_1_5 ?? 0) >= 0.75) args.push(`Plus de 1,5 but estimé à ${formatPct(p.OVER_1_5)}.`);
  if (args.length === 0) args.push(`Aucun argument statistique marquant ne se dégage de l’échantillon${live ? '' : ' simulé'}.`);

  if (match.dataQuality !== 'HIGH') risks.push(`Qualité des données ${match.dataQuality === 'LOW' ? 'faible' : 'moyenne'} (${match.sampleSize} matchs dans l’échantillon${live ? '' : ' simulé'}).`);
  if (Math.abs(diff) < 0.3) risks.push('Rapport de force serré : le match nul reste une issue crédible.');
  if (hf <= 5) risks.push(`Forme récente${live ? '' : ' simulée'} fragile pour ${match.home.name} (${hf} points sur 15).`);
  if (af <= 5) risks.push(`Forme récente${live ? '' : ' simulée'} fragile pour ${match.away.name} (${af} points sur 15).`);
  if (aAtt >= 1.4 && diff > 0) risks.push(`${match.away.name} peut punir en contre : ${formatNumber(aAtt)} ${unit} par match à l’extérieur.`);
  if (match.markets.length === 0) risks.push('Aucune cote disponible pour ce match : il ne peut pas entrer dans un ticket.');
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
  const best = sorted[0] ?? null;
  const explanation = `Indice ${score}/100 calculé à partir de la qualité des données, de la taille de l’échantillon (${match.sampleSize} matchs) et de la netteté du rapport de force.${best ? ` Meilleur marché estimé : ${marketLabel(best.market)} (${formatPct(best.probability)}).` : ''}`;

  return {
    summary,
    xg,
    arguments: args,
    risks,
    confidence: { level, score, explanation },
    bestMarket: best,
    valueMarkets,
  };
}

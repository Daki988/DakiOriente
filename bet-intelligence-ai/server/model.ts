/**
 * Modèle statistique (pas d'IA) : forces offensives/défensives domicile/extérieur calculées
 * sur les résultats réels, rétrécies vers la moyenne de la ligue, puis loi de Poisson.
 * Identique au backend Python (api/_bia/model.py).
 */
import type { RecentMatch } from '../src/types';

export const SHRINK = 4;

export interface Result {
  homeId: number;
  awayId: number;
  homeGoals: number;
  awayGoals: number;
  timestamp: number;
  homeName: string;
  awayName: string;
}

export interface VenueSample {
  played: number;
  scored: number;
  conceded: number;
  won: number;
  drawn: number;
  lost: number;
  cleanSheets: number;
}

export interface TeamProfile {
  home: VenueSample;
  away: VenueSample;
  recent: RecentMatch[];
}

const emptyVenue = (): VenueSample => ({ played: 0, scored: 0, conceded: 0, won: 0, drawn: 0, lost: 0, cleanSheets: 0 });

export class LeagueModel {
  constructor(
    public homeAvg: number,
    public awayAvg: number,
    public teams: Map<number, TeamProfile>,
    public matches: number,
  ) {}

  played(teamId: number): number {
    const t = this.teams.get(teamId);
    return t ? t.home.played + t.away.played : 0;
  }

  /** [attaque domicile, défense domicile, attaque extérieur, défense extérieur] — 1 = moyenne. */
  strength(teamId: number): [number, number, number, number] {
    const t = this.teams.get(teamId) ?? { home: emptyVenue(), away: emptyVenue(), recent: [] };
    const ratio = (total: number, n: number, avg: number) => {
      const raw = n && avg ? total / n / avg : 1;
      const w = n / (n + SHRINK);
      return w * raw + (1 - w);
    };
    return [
      ratio(t.home.scored, t.home.played, this.homeAvg),
      ratio(t.home.conceded, t.home.played, this.awayAvg),
      ratio(t.away.scored, t.away.played, this.awayAvg),
      ratio(t.away.conceded, t.away.played, this.homeAvg),
    ];
  }

  expectedGoals(homeId: number, awayId: number): { home: number; away: number } {
    const [ah, dh] = this.strength(homeId);
    const [, , aa, da] = this.strength(awayId);
    return { home: this.homeAvg * ah * da, away: this.awayAvg * aa * dh };
  }
}

export function buildModel(results: Result[]): LeagueModel {
  const teams = new Map<number, TeamProfile>();
  let hg = 0;
  let ag = 0;
  for (const r of [...results].sort((a, b) => b.timestamp - a.timestamp)) {
    hg += r.homeGoals;
    ag += r.awayGoals;
    const sides: [number, 'home' | 'away', number, number, string, 'DOM' | 'EXT'][] = [
      [r.homeId, 'home', r.homeGoals, r.awayGoals, r.awayName, 'DOM'],
      [r.awayId, 'away', r.awayGoals, r.homeGoals, r.homeName, 'EXT'],
    ];
    for (const [id, venueKey, gf, ga, opp, venue] of sides) {
      let p = teams.get(id);
      if (!p) teams.set(id, (p = { home: emptyVenue(), away: emptyVenue(), recent: [] }));
      const v = p[venueKey];
      v.played++;
      v.scored += gf;
      v.conceded += ga;
      if (ga === 0) v.cleanSheets++;
      if (gf > ga) v.won++;
      else if (gf === ga) v.drawn++;
      else v.lost++;
      if (p.recent.length < 5) {
        p.recent.push({ opponent: opp, venue, goalsFor: gf, goalsAgainst: ga, result: gf > ga ? 'W' : gf === ga ? 'D' : 'L' });
      }
    }
  }
  const n = results.length;
  return new LeagueModel(n ? hg / n : 1.45, n ? ag / n : 1.15, teams, n);
}

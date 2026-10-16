"""Modèle statistique : forces offensives/défensives à partir des résultats réels, puis loi de Poisson.

Ce n'est pas un modèle d'intelligence artificielle. Les forces sont des moyennes de buts
régularisées (rétrécies vers la moyenne de la ligue quand l'échantillon est petit).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

MARKETS = [
    "HOME_WIN", "DRAW", "AWAY_WIN", "DOUBLE_CHANCE_1X", "DOUBLE_CHANCE_X2",
    "OVER_1_5", "OVER_2_5", "UNDER_3_5", "BTTS_YES",
]

# Poids du rétrécissement : avec SHRINK matchs, la force est à mi-chemin entre l'équipe et la moyenne.
SHRINK = 4.0


@dataclass
class Result:
    home_id: int
    away_id: int
    home_goals: int
    away_goals: int
    timestamp: int
    home_name: str = ""
    away_name: str = ""


@dataclass
class VenueSample:
    played: int = 0
    scored: int = 0
    conceded: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    clean_sheets: int = 0


@dataclass
class TeamProfile:
    home: VenueSample = field(default_factory=VenueSample)
    away: VenueSample = field(default_factory=VenueSample)
    recent: list[dict] = field(default_factory=list)  # 5 derniers matchs, du plus récent au plus ancien

    @property
    def played(self) -> int:
        return self.home.played + self.away.played


@dataclass
class LeagueModel:
    home_avg: float
    away_avg: float
    teams: dict[int, TeamProfile]
    matches: int

    def strength(self, team_id: int) -> tuple[float, float, float, float]:
        """(attaque domicile, défense domicile, attaque extérieur, défense extérieur), 1 = moyenne."""
        t = self.teams.get(team_id) or TeamProfile()

        def ratio(total: int, n: int, avg: float) -> float:
            raw = (total / n) / avg if n and avg else 1.0
            w = n / (n + SHRINK)
            return w * raw + (1 - w) * 1.0

        return (
            ratio(t.home.scored, t.home.played, self.home_avg),
            ratio(t.home.conceded, t.home.played, self.away_avg),
            ratio(t.away.scored, t.away.played, self.away_avg),
            ratio(t.away.conceded, t.away.played, self.home_avg),
        )

    def expected_goals(self, home_id: int, away_id: int) -> tuple[float, float]:
        ah, dh, _, _ = self.strength(home_id)
        _, _, aa, da = self.strength(away_id)
        return self.home_avg * ah * da, self.away_avg * aa * dh


def build_model(results: list[Result]) -> LeagueModel:
    teams: dict[int, TeamProfile] = {}
    hg = ag = 0
    for r in sorted(results, key=lambda x: x.timestamp, reverse=True):
        hg += r.home_goals
        ag += r.away_goals
        for tid, venue_key, gf, ga, opp, venue in (
            (r.home_id, "home", r.home_goals, r.away_goals, r.away_name, "DOM"),
            (r.away_id, "away", r.away_goals, r.home_goals, r.home_name, "EXT"),
        ):
            p = teams.setdefault(tid, TeamProfile())
            v: VenueSample = getattr(p, venue_key)
            v.played += 1
            v.scored += gf
            v.conceded += ga
            v.clean_sheets += ga == 0
            if gf > ga:
                v.won += 1
            elif gf == ga:
                v.drawn += 1
            else:
                v.lost += 1
            if len(p.recent) < 5:
                p.recent.append({
                    "opponent": opp, "venue": venue, "goalsFor": gf, "goalsAgainst": ga,
                    "result": "W" if gf > ga else "D" if gf == ga else "L",
                })
    n = len(results)
    return LeagueModel(
        home_avg=hg / n if n else 1.45,
        away_avg=ag / n if n else 1.15,
        teams=teams,
        matches=n,
    )


def poisson_pmf(k: int, lam: float) -> float:
    return math.exp(-lam) * lam**k / math.factorial(k)


def market_wins(market: str, h: int, a: int) -> bool:
    t = h + a
    return {
        "HOME_WIN": h > a, "DRAW": h == a, "AWAY_WIN": a > h,
        "DOUBLE_CHANCE_1X": h >= a, "DOUBLE_CHANCE_X2": a >= h,
        "OVER_1_5": t >= 2, "OVER_2_5": t >= 3, "UNDER_3_5": t <= 3,
        "BTTS_YES": h > 0 and a > 0,
    }[market]


def market_probabilities(lh: float, la: float, max_goals: int = 10) -> dict[str, float]:
    out = {m: 0.0 for m in MARKETS}
    for h in range(max_goals + 1):
        ph = poisson_pmf(h, lh)
        for a in range(max_goals + 1):
            p = ph * poisson_pmf(a, la)
            for m in MARKETS:
                if market_wins(m, h, a):
                    out[m] += p
    return {m: min(1.0, v) for m, v in out.items()}

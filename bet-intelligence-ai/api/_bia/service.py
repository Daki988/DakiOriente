"""Assemble les matchs à venir au format attendu par le frontend (types `Match`)."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from .client import ApiFootballClient
from .config import Settings
from .model import LeagueModel, Result, build_model, market_probabilities

FINISHED = "FT-AET-PEN"
TTL_FINISHED = 6 * 3600
TTL_UPCOMING = 3600
TTL_ODDS = 3 * 3600  # les cotes pré-match sont rafraîchies toutes les 3 h côté fournisseur
TTL_RESULTS = 15 * 60

# (nom du pari API-Football, valeur) → marché de l'application
BET_MAP: dict[tuple[str, str], str] = {
    ("Match Winner", "Home"): "HOME_WIN",
    ("Match Winner", "Draw"): "DRAW",
    ("Match Winner", "Away"): "AWAY_WIN",
    ("Double Chance", "Home/Draw"): "DOUBLE_CHANCE_1X",
    ("Double Chance", "Draw/Away"): "DOUBLE_CHANCE_X2",
    ("Goals Over/Under", "Over 1.5"): "OVER_1_5",
    ("Goals Over/Under", "Over 2.5"): "OVER_2_5",
    ("Goals Over/Under", "Under 3.5"): "UNDER_3_5",
    ("Both Teams Score", "Yes"): "BTTS_YES",
}


def short_name(name: str) -> str:
    letters = "".join(ch for ch in name.upper() if ch.isalpha())
    return letters[:3] or "???"


def to_results(fixtures: list[dict[str, Any]]) -> list[Result]:
    out = []
    for f in fixtures:
        g = f.get("goals") or {}
        if g.get("home") is None or g.get("away") is None:
            continue
        out.append(Result(
            home_id=f["teams"]["home"]["id"], away_id=f["teams"]["away"]["id"],
            home_goals=int(g["home"]), away_goals=int(g["away"]),
            timestamp=int(f["fixture"].get("timestamp") or 0),
            home_name=f["teams"]["home"]["name"], away_name=f["teams"]["away"]["name"],
        ))
    return out


def parse_odds(odds_items: list[dict[str, Any]], preference: list[int]) -> dict[int, dict[str, tuple[float, str]]]:
    """fixture id → marché → (cote, bookmaker), en prenant pour chaque marché le bookmaker préféré disponible."""
    rank = {b: i for i, b in enumerate(preference)}
    out: dict[int, dict[str, tuple[float, str]]] = {}
    for item in odds_items:
        fid = item.get("fixture", {}).get("id")
        if fid is None:
            continue
        books = sorted(item.get("bookmakers") or [], key=lambda b: rank.get(b.get("id"), len(rank) + (b.get("id") or 0)))
        markets = out.setdefault(fid, {})
        for book in books:
            for bet in book.get("bets") or []:
                for v in bet.get("values") or []:
                    m = BET_MAP.get((bet.get("name"), str(v.get("value"))))
                    if not m or m in markets:
                        continue
                    try:
                        odd = float(v.get("odd"))
                    except (TypeError, ValueError):
                        continue
                    if odd > 1:
                        markets[m] = (odd, book.get("name") or "")
    return out


def quality(sample: int) -> str:
    return "HIGH" if sample >= 8 else "MEDIUM" if sample >= 4 else "LOW"


def team_stats(model: LeagueModel, team_id: int, venue: str) -> dict[str, Any]:
    p = model.teams.get(team_id)
    v = getattr(p, venue) if p else None
    n = v.played if v else 0
    return {
        "goalsScoredAvg": round(v.scored / n, 2) if n else 0,
        "goalsConcededAvg": round(v.conceded / n, 2) if n else 0,
        # Données non fournies par ce flux : affichées « — » par l'interface.
        "xgFor": None, "xgAgainst": None, "shotsPerMatch": None, "shotsOnTargetPerMatch": None, "possessionPct": None,
        "cleanSheetPct": round(100 * v.clean_sheets / n) if n else 0,
        "venueRecord": {"played": n, "won": v.won if v else 0, "drawn": v.drawn if v else 0, "lost": v.lost if v else 0},
        "recent": p.recent if p else [],
    }


def build_match(f: dict[str, Any], model: LeagueModel, odds: dict[str, tuple[float, str]]) -> dict[str, Any]:
    h, a = f["teams"]["home"], f["teams"]["away"]
    lh, la = model.expected_goals(h["id"], a["id"])
    probs = market_probabilities(lh, la)
    ph, pa = model.teams.get(h["id"]), model.teams.get(a["id"])
    sample = min(ph.played if ph else 0, pa.played if pa else 0)
    markets = [
        {"market": m, "odds": odds[m][0], "probability": round(probs[m], 4), "bookmaker": odds[m][1]}
        for m in probs if m in odds
    ]
    return {
        "id": str(f["fixture"]["id"]),
        "competitionId": str(f["league"]["id"]),
        "kickoff": f["fixture"]["date"],
        "home": {"id": str(h["id"]), "name": h["name"], "shortName": short_name(h["name"])},
        "away": {"id": str(a["id"]), "name": a["name"], "shortName": short_name(a["name"])},
        "homeStats": team_stats(model, h["id"], "home"),
        "awayStats": team_stats(model, a["id"], "away"),
        "dataQuality": quality(sample) if markets else "LOW",
        "sampleSize": sample,
        "markets": markets,
        "expectedGoals": {"home": round(lh, 3), "away": round(la, 3)},
        "source": "live",
    }


class MatchService:
    def __init__(self, settings: Settings, client: ApiFootballClient):
        self.s = settings
        self.c = client

    def league_model(self, league: int, season: int) -> LeagueModel:
        res = to_results(self.c.get("/fixtures", {"league": league, "season": season, "status": FINISHED}, TTL_FINISHED))
        if len(res) < 40:  # début de saison : on complète avec la saison précédente
            res += to_results(self.c.get("/fixtures", {"league": league, "season": season - 1, "status": FINISHED}, TTL_FINISHED))
        return build_model(res)

    def matches(self, today: date | None = None) -> dict[str, Any]:
        today = today or datetime.now(timezone.utc).date()
        season = self.s.season(today)
        start, end = today.isoformat(), (today + timedelta(days=self.s.days_ahead)).isoformat()
        competitions, matches, errors = [], [], []
        for league in self.s.leagues:
            try:
                upcoming = self.c.get("/fixtures", {"league": league, "season": season, "from": start, "to": end, "timezone": self.s.timezone}, TTL_UPCOMING)
                upcoming = [f for f in upcoming if (f.get("fixture", {}).get("status", {}).get("short") in ("NS", "TBD"))]
                if not upcoming:
                    continue
                lg = upcoming[0]["league"]
                competitions.append({"id": str(lg["id"]), "name": f"{lg['name']} ({lg.get('country') or 'International'})"})
                model = self.league_model(league, season)
                try:
                    odds = parse_odds(self.c.get("/odds", {"league": league, "season": season}, TTL_ODDS), self.s.bookmakers)
                except Exception as e:  # sans cotes, les matchs restent consultables mais ne sont pas sélectionnables
                    odds = {}
                    errors.append({"league": league, "message": f"Cotes indisponibles : {e}"})
                matches.extend(build_match(f, model, odds.get(f["fixture"]["id"], {})) for f in upcoming)
            except Exception as e:  # une ligue en erreur n'empêche pas les autres
                errors.append({"league": league, "message": str(e)})
        matches.sort(key=lambda m: m["kickoff"])
        return {
            "source": "api-football",
            "season": season,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "competitions": competitions,
            "matches": matches,
            "errors": errors,
            "quota": {"limit": self.c.quota.limit, "remaining": self.c.quota.remaining},
        }

    def results(self, fixture_ids: list[int]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for i in range(0, len(fixture_ids), 20):  # 20 identifiants max par requête
            chunk = fixture_ids[i:i + 20]
            for f in self.c.get("/fixtures", {"ids": "-".join(map(str, sorted(chunk)))}, TTL_RESULTS):
                st = f["fixture"]["status"]["short"]
                g = f.get("goals") or {}
                out[str(f["fixture"]["id"])] = {
                    "status": st,
                    "finished": st in ("FT", "AET", "PEN"),
                    "cancelled": st in ("PST", "CANC", "ABD", "AWD", "WO"),
                    # Les paris « temps réglementaire » se règlent sur le score à 90 minutes.
                    "home": (f.get("score", {}).get("fulltime") or {}).get("home", g.get("home")),
                    "away": (f.get("score", {}).get("fulltime") or {}).get("away", g.get("away")),
                }
        return out

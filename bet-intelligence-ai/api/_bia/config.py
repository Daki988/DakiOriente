"""Configuration par variables d'environnement. Aucun secret dans le code."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date

# Identifiants API-Football (v3). Ligues : Premier League, Liga, Serie A, Bundesliga, Ligue 1.
DEFAULT_LEAGUES = [39, 140, 135, 78, 61]
# Bookmakers, par ordre de préférence : 1xBet (très présent en Afrique), Bet365, Pinnacle, Unibet.
DEFAULT_BOOKMAKERS = [11, 8, 4, 16]


def _int_list(raw: str | None, default: list[int]) -> list[int]:
    if not raw:
        return list(default)
    out = [int(x) for x in raw.replace(" ", "").split(",") if x]
    return out or list(default)


def current_season(today: date | None = None) -> int:
    """Saison API-Football = année de début ; les championnats européens démarrent en juillet-août."""
    d = today or date.today()
    return d.year if d.month >= 7 else d.year - 1


@dataclass(frozen=True)
class Settings:
    api_key: str | None = field(default_factory=lambda: os.environ.get("API_FOOTBALL_KEY") or None)
    base_url: str = field(default_factory=lambda: os.environ.get("API_FOOTBALL_BASE_URL", "https://v3.football.api-sports.io"))
    leagues: list[int] = field(default_factory=lambda: _int_list(os.environ.get("LEAGUES"), DEFAULT_LEAGUES))
    bookmakers: list[int] = field(default_factory=lambda: _int_list(os.environ.get("BOOKMAKERS"), DEFAULT_BOOKMAKERS))
    season_override: int | None = field(default_factory=lambda: int(os.environ["SEASON"]) if os.environ.get("SEASON") else None)
    timezone: str = field(default_factory=lambda: os.environ.get("TIMEZONE", "Africa/Libreville"))
    days_ahead: int = field(default_factory=lambda: int(os.environ.get("DAYS_AHEAD", "7")))
    allowed_origin: str = field(default_factory=lambda: os.environ.get("ALLOWED_ORIGIN", "*"))

    @property
    def live(self) -> bool:
        return bool(self.api_key)

    def season(self, today: date | None = None) -> int:
        return self.season_override or current_season(today)

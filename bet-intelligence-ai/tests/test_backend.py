"""Tests du backend sans réseau : transport httpx simulé reproduisant les réponses API-Football."""
from __future__ import annotations

from datetime import date

import httpx
import pytest

from api._bia.client import ApiFootballClient, ApiFootballError
from api._bia.config import Settings, current_season
from api._bia.model import Result, build_model, market_probabilities
from api._bia.service import MatchService, parse_odds

TEAMS = {1: "Alpha FC", 2: "Beta United", 3: "Gamma City", 4: "Delta Town"}


def fx(fid, h, a, hg=None, ag=None, ts=0, status="FT", when="2026-10-10T15:00:00+01:00"):
    return {
        "fixture": {"id": fid, "date": when, "timestamp": ts, "status": {"short": status}},
        "league": {"id": 39, "name": "Premier League", "country": "England", "season": 2026},
        "teams": {"home": {"id": h, "name": TEAMS[h]}, "away": {"id": a, "name": TEAMS[a]}},
        "goals": {"home": hg, "away": ag},
        "score": {"fulltime": {"home": hg, "away": ag}},
    }


FINISHED = [fx(100 + i, h, a, hg, ag, ts=i) for i, (h, a, hg, ag) in enumerate(
    [(1, 2, 3, 0), (3, 4, 1, 1), (2, 3, 0, 2), (4, 1, 0, 2), (1, 3, 2, 1), (2, 4, 1, 1),
     (3, 1, 0, 1), (4, 2, 2, 2), (1, 4, 4, 1), (3, 2, 2, 0)] * 5)]
UPCOMING = [fx(900, 1, 2, status="NS", when="2026-10-18T15:00:00+01:00"), fx(901, 3, 4, status="NS", when="2026-10-18T18:00:00+01:00")]
ODDS = [{
    "fixture": {"id": 900},
    "bookmakers": [
        {"id": 8, "name": "Bet365", "bets": [{"id": 1, "name": "Match Winner", "values": [
            {"value": "Home", "odd": "1.40"}, {"value": "Draw", "odd": "4.50"}, {"value": "Away", "odd": "7.00"}]}]},
        {"id": 11, "name": "1xBet", "bets": [
            {"id": 1, "name": "Match Winner", "values": [{"value": "Home", "odd": "1.45"}, {"value": "Draw", "odd": "4.60"}, {"value": "Away", "odd": "7.20"}]},
            {"id": 5, "name": "Goals Over/Under", "values": [{"value": "Over 1.5", "odd": "1.22"}, {"value": "Under 3.5", "odd": "1.50"}]},
        ]},
    ],
}]


def handler(request: httpx.Request) -> httpx.Response:
    assert request.headers["x-apisports-key"] == "test-key"
    p = dict(request.url.params)
    if request.url.path == "/fixtures" and "ids" in p:
        return httpx.Response(200, json={"response": [fx(900, 1, 2, 2, 1, status="FT")], "paging": {"total": 1}})
    if request.url.path == "/fixtures" and p.get("status"):
        data = FINISHED if p["season"] == "2026" else []
        return httpx.Response(200, json={"response": data, "paging": {"total": 1}}, headers={"x-ratelimit-requests-remaining": "95"})
    if request.url.path == "/fixtures":
        return httpx.Response(200, json={"response": UPCOMING, "paging": {"total": 1}})
    if request.url.path == "/odds":
        return httpx.Response(200, json={"response": ODDS, "paging": {"total": 1}})
    return httpx.Response(404)


def make_service(h=handler):
    http = httpx.Client(base_url="https://x", headers={"x-apisports-key": "test-key"}, transport=httpx.MockTransport(h))
    s = Settings(api_key="test-key", leagues=[39], season_override=2026)
    return MatchService(s, ApiFootballClient("test-key", "https://x", http=http))


def test_season():
    assert current_season(date(2026, 10, 16)) == 2026
    assert current_season(date(2027, 3, 1)) == 2026


def test_probabilities_sum():
    p = market_probabilities(1.6, 1.1)
    assert abs(p["HOME_WIN"] + p["DRAW"] + p["AWAY_WIN"] - 1) < 1e-4
    assert p["OVER_1_5"] > p["OVER_2_5"]


def test_model_strengths():
    m = build_model([Result(1, 2, 3, 0, 1), Result(2, 1, 0, 2, 2)])
    lh, la = m.expected_goals(1, 2)
    assert lh > la  # l'équipe 1 a dominé les deux matchs
    assert m.teams[1].recent[0]["result"] == "W"


def test_parse_odds_prefers_1xbet_then_fallback():
    odds = parse_odds(ODDS, [11, 8])
    assert odds[900]["HOME_WIN"] == (1.45, "1xBet")
    assert odds[900]["OVER_1_5"] == (1.22, "1xBet")
    assert "BTTS_YES" not in odds[900]
    assert parse_odds(ODDS, [8, 11])[900]["HOME_WIN"] == (1.40, "Bet365")


def test_matches_payload_and_cache():
    svc = make_service()
    data = svc.matches(date(2026, 10, 16))
    assert data["errors"] == []
    assert [m["id"] for m in data["matches"]] == ["900", "901"]
    m = data["matches"][0]
    assert {o["market"] for o in m["markets"]} == {"HOME_WIN", "DRAW", "AWAY_WIN", "OVER_1_5", "UNDER_3_5"}
    assert m["dataQuality"] == "HIGH" and m["sampleSize"] >= 8
    assert m["homeStats"]["xgFor"] is None and len(m["homeStats"]["recent"]) == 5
    assert data["matches"][1]["markets"] == [] and data["matches"][1]["dataQuality"] == "LOW"
    assert data["quota"]["remaining"] == 95
    calls = svc.c.calls
    svc.matches(date(2026, 10, 16))
    assert svc.c.calls == calls  # tout est servi par le cache


def test_results():
    r = make_service().results([900])
    assert r["900"] == {"status": "FT", "finished": True, "cancelled": False, "home": 2, "away": 1}


def test_api_errors_are_raised():
    def bad(_):
        return httpx.Response(200, json={"errors": {"token": "Error/Missing application key."}, "response": []})
    with pytest.raises(ApiFootballError, match="token"):
        make_service(bad).c.get("/fixtures", {"league": 39}, 60)


def test_league_error_isolated():
    def flaky(req):
        if req.url.path == "/odds":
            return httpx.Response(200, json={"errors": {"plan": "Free plans do not have access to this season"}, "response": []})
        return handler(req)
    data = make_service(flaky).matches(date(2026, 10, 16))
    assert len(data["matches"]) == 2 and all(m["markets"] == [] for m in data["matches"])
    assert "plan" in data["errors"][0]["message"]


def test_http_api_demo_mode(monkeypatch):
    from fastapi.testclient import TestClient
    from api import index
    monkeypatch.setattr(index, "settings", Settings(api_key=None))
    c = TestClient(index.app)
    assert c.get("/api/health").json()["live"] is False
    assert c.get("/api/matches").status_code == 503

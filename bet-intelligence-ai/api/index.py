"""API HTTP (FastAPI). Sur Vercel : fonction Python servie sous /api/*. En local :
    uvicorn api.index:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

try:  # import relatif (package) ou absolu (Vercel charge le fichier seul)
    from ._bia.client import ApiFootballClient, ApiFootballError
    from ._bia.config import Settings
    from ._bia.service import MatchService
except ImportError:  # pragma: no cover
    from _bia.client import ApiFootballClient, ApiFootballError
    from _bia.config import Settings
    from _bia.service import MatchService

settings = Settings()
app = FastAPI(title="BET INTELLIGENCE AI", docs_url="/api/docs", openapi_url="/api/openapi.json")
app.add_middleware(CORSMiddleware, allow_origins=[settings.allowed_origin], allow_methods=["GET"], allow_headers=["*"])

_service: MatchService | None = None


def service() -> MatchService:
    global _service
    if not settings.live:
        raise HTTPException(503, "API_FOOTBALL_KEY non configurée : l'application reste en mode démonstration.")
    if _service is None:
        _service = MatchService(settings, ApiFootballClient(settings.api_key, settings.base_url))
    return _service


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "live": settings.live,
        "provider": "API-Football" if settings.live else None,
        "leagues": settings.leagues,
        "season": settings.season(),
    }


@app.get("/api/matches")
def matches(response: Response) -> dict:
    try:
        data = service().matches()
    except ApiFootballError as e:
        raise HTTPException(502, f"API-Football : {e}") from e
    # Cache CDN : protège le quota quotidien du fournisseur.
    response.headers["Cache-Control"] = "public, s-maxage=1800, stale-while-revalidate=3600"
    return data


@app.get("/api/results")
def results(response: Response, ids: str = Query(..., description="Identifiants de matchs séparés par des virgules")) -> dict:
    try:
        parsed = sorted({int(x) for x in ids.split(",") if x.strip()})[:100]
    except ValueError as e:
        raise HTTPException(400, "Identifiants invalides.") from e
    try:
        data = service().results(parsed)
    except ApiFootballError as e:
        raise HTTPException(502, f"API-Football : {e}") from e
    response.headers["Cache-Control"] = "public, s-maxage=600"
    return {"results": data}

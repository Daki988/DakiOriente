"""Client API-Football avec cache en mémoire et suivi du quota (en-têtes x-ratelimit-*)."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import httpx


class ApiFootballError(RuntimeError):
    """Erreur renvoyée par l'API (clé invalide, quota épuisé, plan insuffisant…)."""


@dataclass
class Quota:
    limit: int | None = None
    remaining: int | None = None


class ApiFootballClient:
    def __init__(self, api_key: str, base_url: str, http: httpx.Client | None = None):
        self._http = http or httpx.Client(base_url=base_url, timeout=20.0, headers={"x-apisports-key": api_key})
        self._cache: dict[str, tuple[float, Any]] = {}
        self.quota = Quota()
        self.calls = 0

    def get(self, path: str, params: dict[str, Any], ttl: float) -> list[dict[str, Any]]:
        """GET paginé ; renvoie la concaténation des `response`. Résultat mis en cache `ttl` secondes."""
        key = path + "?" + "&".join(f"{k}={params[k]}" for k in sorted(params))
        hit = self._cache.get(key)
        if hit and hit[0] > time.time():
            return hit[1]
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            query = dict(params)
            if page > 1:
                query["page"] = page
            res = self._http.get(path, params=query)
            self.calls += 1
            self._read_quota(res.headers)
            if res.status_code != 200:
                raise ApiFootballError(f"HTTP {res.status_code} sur {path}")
            body = res.json()
            errors = body.get("errors")
            if errors:
                # L'API renvoie les erreurs (clé, quota, saison non couverte par le plan) dans un dict ou une liste.
                msg = "; ".join(f"{k}: {v}" for k, v in errors.items()) if isinstance(errors, dict) else "; ".join(map(str, errors))
                raise ApiFootballError(msg)
            items.extend(body.get("response") or [])
            paging = body.get("paging") or {}
            if page >= int(paging.get("total") or 1) or page >= 10:
                break
            page += 1
        self._cache[key] = (time.time() + ttl, items)
        return items

    def _read_quota(self, headers: httpx.Headers) -> None:
        for name, attr in (("x-ratelimit-requests-limit", "limit"), ("x-ratelimit-requests-remaining", "remaining")):
            v = headers.get(name)
            if v is not None and v.isdigit():
                setattr(self.quota, attr, int(v))

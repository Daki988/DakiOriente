#!/usr/bin/env python3
"""Instantané des taux de change (base : dirham marocain), utilisé en secours si le service en ligne est indisponible.
Source : open.er-api.com (ExchangeRate-API, mise à jour quotidienne). Usage : python3 scripts/fetch_taux.py"""
import datetime, json, os, requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = requests.get("https://open.er-api.com/v6/latest/MAD", timeout=30).json()
assert r.get("result") == "success"
out = {"_meta": {"referentiel": "taux_change", "base": "MAD", "date": datetime.date.today().isoformat(), "maj_source": r["time_last_update_utc"],
                 "source": "https://open.er-api.com (ExchangeRate-API)", "note": "1 MAD = x devise. Instantané de secours ; le site interroge la source chaque jour."},
       "taux": {k: v for k, v in sorted(r["rates"].items())}}
json.dump(out, open(os.path.join(ROOT, "data", "referentiels", "taux_change.json"), "w"), ensure_ascii=False, indent=1)
print(len(out["taux"]), "devises ; 1 MAD =", out["taux"]["XOF"], "XOF,", out["taux"]["EUR"], "EUR")

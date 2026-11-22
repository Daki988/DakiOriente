#!/usr/bin/env python3
"""Coût de la vie étudiante par ville du Maroc → couts_etudes.json › MA › personnalisation › villes.

Source : data/sources/maroc/couts_villes_2026-11.json (relevé du 22/11/2026 : Numbeo, annonces Avito, opérateurs de
transport ; fiabilité « sourcé », « partiel » ou « estimation » par ville). Le niveau de vie « normal » vient du relevé ;
« économe » et « confortable » en sont déduits avec les rapports de la grille nationale (≈ 0,68 et ≈ 1,53).
Utilisé par lib/devis.ts (coutVille) : devis standard et personnalisé, pages villes. Script idempotent.
"""
import json
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / "data" / "sources" / "maroc" / "couts_villes_2026-11.json"
REF = RACINE / "data" / "referentiels" / "couts_etudes.json"


def f(p):
    return {"min": int(p[0]), "max": int(p[1])}


def main():
    src = json.loads(SRC.read_text())
    urls = {s["id"]: s["url"] for s in src["sources"]}
    doc = json.loads(REF.read_text())
    ma = next(c for c in doc["items"] if c["id"] == "MA")
    villes = {}
    for nom, v in src["villes"].items():
        n = v["vie_hors_logement_normal"]
        villes[nom] = {
            "logement_mensuel": {k: f(v["loyer"][k]) for k in ("colocation", "studio", "standing")},
            "vie_hors_logement": {"econome": {"min": round(n[0] * 0.68 / 10) * 10, "max": round(n[1] * 0.68 / 10) * 10}, "normal": f(n),
                                  "confortable": {"min": round(n[0] * 1.53 / 10) * 10, "max": round(n[1] * 1.53 / 10) * 10}},
            "transport": {"tram": f(v["transport"]["mensuel_transport_commun"]), "taxi": f(v["transport"]["mensuel_taxi"])},
            "reseau": v["transport"]["reseau"], "fiabilite": v["fiabilite"],
            "sources": [urls[s] for s in v["sources"] if s in urls], "remarques": v.get("remarques", ""),
        }
    ma["personnalisation"]["villes"] = villes
    ma["personnalisation"]["_villes"] = f"Coût de la vie par ville, relevé du {src['date_releve']} (scripts/couts_villes_maroc.py) : {src['hypotheses']}"
    REF.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(villes)} villes écrites dans couts_etudes.json")


if __name__ == "__main__":
    main()

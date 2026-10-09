#!/usr/bin/env python3
"""Vérifie la cohérence des référentiels Navigoal (identifiants uniques, références croisées, fichiers logos).

Usage : python3 scripts/validate_referentiels.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels")


def load(name):
    with open(os.path.join(REF, name + ".json"), encoding="utf-8") as f:
        return json.load(f)["items"]


def main():
    errors = []
    data = {n: load(n) for n in ["pays", "niveaux", "domaines", "competences", "formations", "metiers", "series",
                                 "etablissements_superieurs", "etablissements_secondaires", "navilease_logements"]}
    ids = {}
    for name, items in data.items():
        key = "code" if name == "profils_riasec" else "id"
        seen = set()
        for it in items:
            if it[key] in seen:
                errors.append(f"{name}: identifiant dupliqué {it[key]}")
            seen.add(it[key])
        ids[name] = seen
    riasec = {p["code"] for p in load("profils_riasec")}

    def check(src, ref_name, values):
        for v in values:
            if v not in ids[ref_name]:
                errors.append(f"{src}: référence inconnue vers {ref_name} -> {v}")

    for c in data["competences"]:
        if c["domaine"]:
            check(c["id"], "domaines", [c["domaine"]])
    for f in data["formations"]:
        check(f["id"], "domaines", [f["domaine"]])
        check(f["id"], "niveaux", [f["niveau"]])
        check(f["id"], "competences", f["competences"])
        check(f["id"], "metiers", f["metiers"])
        check(f["id"], "etablissements_superieurs", f["etablissements"])
        for pays, series in f["series_recommandees"].items():
            check(f["id"], "pays", [pays])
            check(f["id"], "series", series)
    for m in data["metiers"]:
        check(m["id"], "domaines", [m["domaine"]])
        check(m["id"], "niveaux", [m["niveau_min"]])
        check(m["id"], "competences", m["competences"])
        check(m["id"], "formations", m["formations"])
        if not set(m["riasec"]) <= riasec:
            errors.append(f"{m['id']}: code RIASEC invalide {m['riasec']}")
    for s in data["series"]:
        check(s["id"], "pays", [s["pays"]])
        check(s["id"], "domaines", s["domaines_ouverts"])
        check(s["id"], "formations", s["formations_accessibles"])
        check(s["id"], "metiers", s["metiers_exemples"])
    for e in data["etablissements_superieurs"]:
        check(e["id"], "pays", [e["pays"]])
        check(e["id"], "formations", e["formations"])
    for e in data["etablissements_secondaires"]:
        check(e["id"], "pays", [e["pays"]])
        check(e["id"], "series", e["series_proposees"])
    for r in data["navilease_logements"]:
        check(r["id"], "pays", [r["pays"]])
        check(r["id"], "etablissements_superieurs", r["etablissements_desservis"])

    for name in ("etablissements_superieurs", "etablissements_secondaires"):
        for e in data[name]:
            logo = e.get("logo")
            if logo and not os.path.exists(os.path.join(ROOT, logo["fichier"])):
                errors.append(f"{e['id']}: fichier logo manquant {logo['fichier']}")
            for ph in e.get("photos") or []:
                if not os.path.exists(os.path.join(ROOT, ph["fichier"])):
                    errors.append(f"{e['id']}: fichier photo manquant {ph['fichier']}")
                if ph.get("methode") == "wikimedia_commons" and not ph.get("credit"):
                    errors.append(f"{e['id']}: photo Commons sans crédit d'auteur")
    for e in data["etablissements_superieurs"]:
        if e["statut"] in ("public", "public_autonome"):
            errors.append(f"{e['id']}: établissement public présent au catalogue (doit être archivé)")
    check("pays_details", "pays", [p["id"] for p in load("pays_details")])

    for name, items in data.items():
        print(f"{name:28s} {len(items):5d}")
    if errors:
        print(f"\n{len(errors)} erreur(s) :")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("\nOK : référentiels cohérents.")


if __name__ == "__main__":
    main()

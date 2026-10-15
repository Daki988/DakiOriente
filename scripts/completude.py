#!/usr/bin/env python3
"""Complétude des fiches établissements (data/referentiels/etablissements_superieurs.json).

Pour chaque établissement : champs renseignés (description, adresse, téléphone, e-mail, site, année de création,
programmes présentés, frais, admission, bourses, international, photos, logo, géolocalisation) et score.
Sortie : data/sources/maroc/completude.json + résumé console.
Usage : python3 scripts/completude.py [--detail]"""
import argparse, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels", "etablissements_superieurs.json")
OUT = os.path.join(ROOT, "data", "sources", "maroc", "completude.json")

CHAMPS = ["description", "adresse", "telephone", "email", "site_web", "annee_creation", "programmes", "frais",
          "admission", "bourses", "international", "photos", "logo", "geolocalisation"]


def rempli(v):
    return v not in (None, "", [], {})


def champs(it):
    s = it.get("site") or {}
    contact = s.get("contact") or {}
    adm = s.get("admission") or {}
    geo = it.get("geo") or {}
    logo = it.get("logo") or {}
    photos = [p for p in (it.get("photos") or []) if p.get("fichier") and os.path.exists(os.path.join(ROOT, p["fichier"]))]
    campus = it.get("campus") or []
    return {
        "description": rempli(it.get("description")),
        "adresse": rempli(it.get("adresse")) or any(rempli(c.get("adresse")) for c in campus),
        "telephone": rempli(contact.get("telephone")),
        "email": rempli(contact.get("email")),
        "site_web": rempli(it.get("site_web")),
        "annee_creation": rempli(it.get("annee_creation")),
        "programmes": rempli(s.get("programmes")),
        "frais": rempli(s.get("frais")),
        "admission": rempli(adm.get("conditions")) or rempli(adm.get("etapes")) or rempli(adm.get("concours")) or rempli(adm.get("dates")),
        "bourses": rempli(s.get("bourses")),
        "international": rempli(s.get("international")),
        "photos": len(photos) >= 1,
        "logo": bool(logo.get("fichier")) and os.path.exists(os.path.join(ROOT, logo["fichier"])),
        "geolocalisation": rempli(it.get("coordonnees")) or rempli(geo.get("coordonnees"))
                           or any(rempli(c.get("coordonnees")) or rempli((c.get("geo") or {}).get("coordonnees")) for c in campus),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--detail", action="store_true", help="affiche la liste des établissements incomplets")
    a = ap.parse_args()
    items = json.load(open(REF, encoding="utf-8"))["items"]
    lignes = []
    for it in items:
        c = champs(it)
        manquants = [k for k in CHAMPS if not c[k]]
        lignes.append(dict(id=it["id"], nom=it["nom"], label=it.get("label"), champs=c, manquants=manquants,
                           score=round(100 * (len(CHAMPS) - len(manquants)) / len(CHAMPS), 1)))
    lignes.sort(key=lambda l: (l["score"], l["id"]))
    n = len(lignes)
    par_champ = {k: sum(l["champs"][k] for l in lignes) for k in CHAMPS}
    resume = dict(
        etablissements=n,
        score_moyen=round(sum(l["score"] for l in lignes) / n, 1) if n else 0,
        complets=sum(1 for l in lignes if not l["manquants"]),
        par_champ={k: dict(remplis=v, pourcentage=round(100 * v / n, 1)) for k, v in par_champ.items()},
    )
    json.dump(dict(_meta=dict(date="2026-10-15", source="data/referentiels/etablissements_superieurs.json", champs=CHAMPS),
                   resume=resume, etablissements=lignes), open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{n} établissements — score moyen {resume['score_moyen']} % — complets {resume['complets']}")
    for k in CHAMPS:
        v = par_champ[k]
        print(f"  {k:16} {v:4}/{n}  {100 * v / n:5.1f} %  {'#' * round(30 * v / n)}")
    incomplets = [l for l in lignes if l["manquants"]]
    print(f"{len(incomplets)} établissements incomplets")
    for l in incomplets if a.detail else incomplets[:15]:
        print(f"  {l['score']:5.1f}  {l['id']:28} manque : {', '.join(l['manquants'])}")
    if not a.detail and len(incomplets) > 15:
        print(f"  … (--detail pour les {len(incomplets) - 15} autres)")
    print("→", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()

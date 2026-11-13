#!/usr/bin/env python3
"""Frais de scolarité réellement publiés par les écoles, relevés dans le texte de leurs sites.

Lit les relevés produits par crawl_sites.py (un .txt par établissement) et en extrait les montants
annoncés comme frais de scolarité annuels, avec la phrase exacte et l'adresse de la page comme preuve.
Rien n'est deviné : seules les phrases qui annoncent explicitement un montant de scolarité sont retenues.

Sortie : un fichier de propositions JSON à relire, puis (avec --appliquer) écriture du champ « frais »
dans data/sources/maroc/sites/<id>.json.

Usage : python3 scripts/extraire_frais.py --textes DOSSIER [--sortie f.json] [--appliquer]
"""
import argparse
import datetime
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "data", "sources", "maroc", "sites")
TODAY = datetime.date.today().isoformat()

# Un montant en dirhams : « 45 000 DH », « 45.000 Dhs », « MAD 45 000 », « 45000 dirhams ».
MONTANT = r"(?:MAD|DHS?|DH)?\s?(\d{1,3}(?:[  .  ]\d{3})+|\d{4,6})\s?(?:MAD|DHS?|DH|dirhams?)"
SCOLARITE = re.compile(r"(frais\s+(?:de\s+)?(?:scolarit|formation|p[ée]dagogiques)|scolarit[ée]\s+annuelle|droits?\s+de\s+scolarit|tuition\s+fees?|co[uû]t\s+(?:de\s+la\s+)?formation)", re.I)
INSCRIPTION = re.compile(r"(frais\s+(?:de\s+)?(?:dossier|inscription|concours)|droits?\s+d.inscription)", re.I)
PAR_AN = re.compile(r"(par\s+an|/\s?an\b|annuel|annuelle|par\s+ann[ée]e|/\s?ann[ée]e|an\b)", re.I)
PAR_MOIS = re.compile(r"(par\s+mois|/\s?mois|mensuel)", re.I)
CYCLE_ENTIER = re.compile(r"(tout\s+le\s+cycle|cursus\s+complet|pour\s+les\s+\d\s+ann[ée]es|total\s+du\s+cycle)", re.I)
# Niveau mentionné dans la phrase, pour nommer le cycle.
CYCLES = [(r"doctorat|m[ée]decine", "Doctorat / médecine"), (r"master|bac\s?\+\s?5|mast[èe]re|mba", "Master / Bac+5"),
          (r"ing[ée]nieur|cycle\s+ing", "Cycle ingénieur"), (r"licence|bachelor|bac\s?\+\s?3", "Licence / Bac+3"),
          (r"bts|dut|technicien|bac\s?\+\s?2", "BTS / Bac+2"), (r"pr[ée]pa|cpge", "Classes préparatoires")]
MINI, MAXI = 8000, 250000  # en dessous : droits d'inscription ; au-dessus : total d'un cycle entier


def phrases(txt):
    """Phrases du relevé, avec l'adresse de la page où elles figurent."""
    url = ""
    for bloc in txt.split("\n"):
        b = bloc.strip()
        if b.startswith("=== PAGE :"):
            url = b.split(":", 1)[1].strip()
            continue
        for p in re.split(r"(?<=[.!?;])\s+|\s{2,}|\n", b):
            p = re.sub(r"\s+", " ", p).strip()
            if 12 < len(p) < 400:
                yield p, url


def nombre(s):
    return int(re.sub(r"[^\d]", "", s))


def cycle_de(p):
    for motif, nom in CYCLES:
        if re.search(motif, p, re.I):
            return nom
    return "Scolarité annuelle"


def extraire(txt):
    """Montants de scolarité annuelle trouvés, par phrase (sans doublon de montant)."""
    trouves, vus = [], set()
    for p, url in phrases(txt):
        if not SCOLARITE.search(p) or CYCLE_ENTIER.search(p):
            continue
        if PAR_MOIS.search(p) and not PAR_AN.search(p):
            continue  # paiement mensuel : on ne reconstitue pas un total
        for m in re.finditer(MONTANT, p, re.I):
            v = nombre(m.group(1))
            if not (MINI <= v <= MAXI) or v in vus:
                continue
            # Un montant juste après « inscription » est un droit d'inscription, pas la scolarité.
            avant = p[max(0, m.start() - 60):m.start()]
            if INSCRIPTION.search(avant) and not SCOLARITE.search(avant):
                continue
            vus.add(v)
            trouves.append({"cycle": cycle_de(p), "inscription_mad": None, "scolarite_annuelle_mad": v,
                            "note": f"Site de l'école : « {p} » ({url})"})
    # Deux montants au plus par école : le plus bas et le plus haut (fourchette publiée).
    trouves.sort(key=lambda x: x["scolarite_annuelle_mad"])
    return trouves[:1] + trouves[-1:] if len(trouves) > 1 else trouves


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--textes", required=True)
    ap.add_argument("--sortie", default=None)
    ap.add_argument("--appliquer", action="store_true")
    a = ap.parse_args()

    props = {}
    for f in sorted(glob.glob(os.path.join(a.textes, "*.txt"))):
        ident = os.path.basename(f)[:-4]
        res = extraire(open(f, encoding="utf-8", errors="ignore").read())
        if res:
            props[ident] = res
    if a.sortie:
        json.dump(props, open(a.sortie, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
    print(f"{len(props)} établissement(s) avec des frais publiés trouvés dans le texte de leur site :")
    for k, v in props.items():
        print(f"  {k:28} {' · '.join(f'{x['scolarite_annuelle_mad']:,} MAD ({x['cycle']})'.replace(',', ' ') for x in v)}")
    if a.appliquer:
        n = 0
        for ident, frais in props.items():
            p = os.path.join(SITES, f"{ident}.json")
            if not os.path.exists(p):
                continue
            d = json.load(open(p, encoding="utf-8"))
            if d.get("frais"):
                continue  # déjà relevé à la main : on n'écrase pas
            d["frais"] = frais
            d["date_collecte"] = TODAY
            json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            n += 1
        print(f"{n} fiche(s) de site mise(s) à jour.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

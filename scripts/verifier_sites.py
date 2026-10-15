#!/usr/bin/env python3
"""Contrôle des informations extraites des sites (data/sources/maroc/sites/<id>.json) contre le texte relevé
(scripts/crawl_sites.py). Toute donnée sans citation exacte retrouvée dans le texte est retirée :
adresse, téléphone, e-mail, année de création, frais, admission ; un programme dont l'intitulé n'apparaît
pas dans le texte est écarté. Usage : python3 scripts/verifier_sites.py --textes DOSSIER"""
import argparse, glob, json, os, re, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "data", "sources", "maroc", "sites")


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " et ").replace("’", "'")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def present(citation, texte_n):
    c = norm(citation)
    return len(c) >= 6 and c in texte_n


def chiffres(s):
    return set(re.findall(r"\d{1,3}(?:[ .,\u202f]\d{3})+(?!\d)|\d{3,}", (s or "").replace("\u00a0", " ")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--textes", required=True)
    a = ap.parse_args()
    bilan = {}
    for f in sorted(glob.glob(os.path.join(SITES, "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        t = os.path.join(a.textes, d["id"] + ".txt")
        if not os.path.exists(t) or "preuves" not in d:  # fiche saisie et vérifiée à la main
            continue
        tn = norm(open(t, encoding="utf-8").read())
        tn_compact = tn.replace(" ", "")
        pr = d.get("preuves") or {}
        retraits = []
        for champ in ("adresse", "telephone", "email", "annee_creation"):
            if d.get(champ) in (None, "", []):
                continue
            c = pr.get(champ)
            ok = present(c, tn) if c else False
            if champ == "telephone" and not ok:
                ok = re.sub(r"\D", "", d[champ])[-8:] in re.sub(r"\D", "", tn)
            if champ == "email" and not ok:
                ok = norm(d[champ]) in tn
            if champ == "annee_creation" and ok:
                ok = str(d[champ]) in (c or "")
            if not ok:
                d[champ] = None
                retraits.append(champ)
        # Frais : chaque montant doit figurer dans une citation exacte du texte
        cit_frais = [c for c in (pr.get("frais") or []) if present(c, tn)]
        nombres = set().union(*[chiffres(c) for c in cit_frais]) if cit_frais else set()
        nombres = {re.sub(r"\D", "", n) for n in nombres}
        frais = []
        for x in d.get("frais") or []:
            ok = all(str(v) in nombres for v in (x.get("inscription_mad"), x.get("scolarite_annuelle_mad")) if v)
            (frais.append(x) if ok and (x.get("inscription_mad") or x.get("scolarite_annuelle_mad")) else retraits.append("frais:" + str(x.get("cycle"))))
        d["frais"] = frais
        adm = d.get("admission") or {}
        if adm and not [c for c in (pr.get("admission") or []) if present(c, tn)]:
            d["admission"] = {"conditions": [], "etapes": [], "concours": None, "dates": None}
            if adm.get("conditions") or adm.get("etapes"):
                retraits.append("admission")
        progs = []
        for p in d.get("programmes") or []:
            mots = [m for m in norm(p.get("intitule")).split() if len(m) > 3 and m not in {"licence", "master", "bachelor", "diplome", "cycle", "programme", "formation"}]
            if mots and all(m in tn for m in mots):
                progs.append(p)
            else:
                retraits.append("programme:" + (p.get("intitule") or "")[:40])
        d["programmes"] = progs
        d["verification"] = {"date": "2026-10-15", "retraits": retraits}
        json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        bilan[d["id"]] = (len(progs), len(frais), len(retraits))
        print(f"{d['id']:30} programmes {len(progs):3}  frais {len(frais)}  retirés {len(retraits)} {retraits[:4]}")
    print(len(bilan), "fichiers vérifiés")


if __name__ == "__main__":
    main()

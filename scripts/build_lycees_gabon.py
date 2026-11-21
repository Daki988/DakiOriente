#!/usr/bin/env python3
"""Lycées du Gabon pour le formulaire d'inscription (novembre 2026).

Sources (data/sources/gabon/) :
- lycees_bac_general.json : établissements présentant des candidats au bac général, par centre d'examen
  (examensgabon.com, Office du baccalauréat), relevé du 21/11/2026 ;
- lycees_techniques.json : lycées techniques de la Direction des examens de l'enseignement technique (bactechgabon.com).
Le centre d'examen donne la province. Les lycées déjà présents dans le référentiel (curation, Wikidata) sont
rapprochés par leur nom et reçoivent leur province ; les autres sont ajoutés (source « examens-gabon »).
Écrit data/referentiels/etablissements_secondaires.json. Script idempotent.
"""
import json
import re
import unicodedata
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
REF = RACINE / "data" / "referentiels" / "etablissements_secondaires.json"
SRC = RACINE / "data" / "sources" / "gabon"
PROVINCE_CENTRE = {"LBV": "Estuaire", "NTM": "Estuaire", "FCV": "Haut-Ogooué", "OYE": "Woleu-Ntem", "MLA": "Ngounié", "POG": "Ogooué-Maritime",
                   "LRN": "Moyen-Ogooué", "KLM": "Ogooué-Lolo", "MKO": "Ogooué-Ivindo", "TBG": "Nyanga"}
VILLE_CENTRE = {"LBV": "Libreville", "NTM": "Ntoum", "FCV": "Franceville", "OYE": "Oyem", "MLA": "Mouila", "POG": "Port-Gentil",
                "LRN": "Lambaréné", "KLM": "Koulamoutou", "MKO": "Makokou", "TBG": "Tchibanga"}
PROVINCE_VILLE = {"Libreville": "Estuaire", "Akanda": "Estuaire", "Owendo": "Estuaire", "Ntoum": "Estuaire", "Bikélé": "Estuaire", "Essassa": "Estuaire",
                  "Franceville": "Haut-Ogooué", "Oyem": "Woleu-Ntem", "Lambaréné": "Moyen-Ogooué", "Mouila": "Ngounié", "Moabi": "Nyanga",
                  "Port-Gentil": "Ogooué-Maritime", "Tchibanga": "Nyanga", "Makokou": "Ogooué-Ivindo", "Koulamoutou": "Ogooué-Lolo"}
EXCLUS = re.compile(r"^candidats? libres?", re.I)
# Corrections de casse ou de coquilles du relevé
NOMS = {"LYCEE AHMED KHADIM OYABI": "Lycée Ahmed Khadim OYABI", "ECOLE INTERNATIONALE DE FRANCEVILLE": "École internationale de Franceville",
        "lycée Privé Gaston MBEMBE": "Lycée Privé Gaston MBEMBE", "EPL COLLEGE ET LYCEE LE GUIDE DE NOS ENFANTS PLUS": "EPL Collège et Lycée Le Guide de nos enfants Plus",
        "Lycée Alliance Chretienne Martin EFFA NDONG": "Lycée Alliance Chrétienne Martin EFFA NDONG", "Lycée Evangelique d'OWENDO": "Lycée Évangélique d'OWENDO"}
AJOUTS = [("Lycée Français Victor Hugo de Port-Gentil", "Ogooué-Maritime", "Port-Gentil", "prive_international")]
VIDES = {"lycee", "prive", "public", "college", "et", "de", "d", "l", "la", "le", "les", "des", "du", "national", "fondation", "fdt", "institution", "complexe", "scolaire", "general"}


def cle(nom):
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return {m for m in re.findall(r"[a-z0-9]+", s) if m not in VIDES and len(m) > 1}


def slug(nom):
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


def statut(nom):
    n = nom.lower()
    if re.search(r"priv|catholique|evang|évang|alliance chr|saint|sainte|notre dame|islamique|adventiste|immacul|mgr|monseigneur|institut|complexe|académie|cours |groupe scolaire|fondation|don bosco|collège et lycée|epl ", n): return "prive"
    if re.search(r"public|national|c\.?e\.?s|excellence|militaire|prytan|d'application|technique", n): return "public"
    return None


def main():
    doc = json.loads(REF.read_text())
    items = doc["items"]
    ga = [e for e in items if e["pays"] == "GA"]
    for e in ga:
        if not e.get("province"):
            v = e.get("ville") or ""
            e["province"] = PROVINCE_VILLE.get(v) or next((p for k, p in PROVINCE_VILLE.items() if k.lower() in e["nom"].lower()), None)
    for e in ga:  # casse des noms importés de Wikidata
        if e.get("source") == "wikidata": e["nom"] = " ".join(m[:1].upper() + m[1:] if m not in ("de", "du", "la", "le", "les", "des") and not m.startswith(("d'", "l'")) else m for m in e["nom"].split())
        e["nom"] = re.sub(r"\s{2,}", " ", e["nom"])
    existants = [(cle(e["nom"]), e) for e in ga if e["type"] != "college"]
    ids = {e["id"] for e in items}
    ajoutes = rapproches = 0

    def trouver(nom):
        k = cle(nom)
        for k2, e in existants:
            if k and (k == k2 or (len(k & k2) >= 2 and (k <= k2 or k2 <= k))): return e
        return None

    bac = json.loads((SRC / "lycees_bac_general.json").read_text())["items"]
    for x in bac:
        nom = NOMS.get(x["nom"], x["nom"]).strip()
        if EXCLUS.match(nom): continue
        centre = re.sub(r"B$", "", x["centres"][0])
        series = [f"ga-bac-{s.lower()}" for s in x["series"]]
        e = trouver(nom)
        if e:
            e.setdefault("province", PROVINCE_CENTRE[centre]); e["province"] = e["province"] or PROVINCE_CENTRE[centre]
            e["series_proposees"] = sorted(set(e.get("series_proposees") or []) | set(series)); rapproches += 1
            continue
        i = f"ga-lyc-{slug(nom)}"
        while i in ids: i += "-2"
        e = {"id": i, "nom": nom, "pays": "GA", "ville": None, "province": PROVINCE_CENTRE[centre], "centre_examen": VILLE_CENTRE[centre], "type": "lycee",
             "statut": statut(nom), "site_web": None, "wikidata": None, "series_proposees": series, "particularites": None, "logo": None, "source": "examens-gabon"}
        items.append(e); ids.add(i); existants.append((cle(nom), e)); ajoutes += 1
    tech = json.loads((SRC / "lycees_techniques.json").read_text())["items"]
    for x in tech:
        e = trouver(x["nom"])
        if e:
            e["type"] = "lycee_technique" if "techni" in x["nom"].lower() else e["type"]
            e["province"] = e.get("province") or x["province"]; rapproches += 1; continue
        i = f"ga-lyc-{slug(x['nom'])}"
        e = {"id": i, "nom": x["nom"], "pays": "GA", "ville": None, "province": x["province"], "type": "lycee_technique", "statut": "public", "site_web": None,
             "wikidata": None, "series_proposees": [], "particularites": None, "logo": None, "source": "examens-gabon"}
        items.append(e); ids.add(i); existants.append((cle(x["nom"]), e)); ajoutes += 1
    for nom, prov, ville, st in AJOUTS:
        if not trouver(nom):
            i = f"ga-lyc-{slug(nom)}"
            items.append({"id": i, "nom": nom, "pays": "GA", "ville": ville, "province": prov, "type": "lycee", "statut": st, "site_web": None, "wikidata": None,
                          "series_proposees": [], "particularites": "Lycée français (baccalauréat français).", "logo": None, "source": "curation"}); ajoutes += 1
    doc["_meta"]["gabon"] = "Lycées du Gabon complétés le 21/11/2026 depuis les listes officielles des examens (examensgabon.com, bactechgabon.com) : scripts/build_lycees_gabon.py."
    REF.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    n = sum(1 for e in items if e["pays"] == "GA" and e["type"] != "college")
    print(f"{ajoutes} lycées ajoutés, {rapproches} rapprochés de fiches existantes ; {n} lycées gabonais au référentiel")


if __name__ == "__main__":
    main()

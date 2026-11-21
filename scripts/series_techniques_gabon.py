#!/usr/bin/env python3
"""Séries du bac technique et du bac professionnel du Gabon (novembre 2026).

Source : liste officielle des séries de la Direction des examens et concours de l'enseignement technique et de la
formation professionnelle (https://bactechgabon.com/affiche_listinscritserie.php, relevée le 21/11/2026).
Chaque nouvelle série reprend les domaines, le profil RIASEC et les formations accessibles de la série la plus proche
du référentiel (ex. ACA ≈ G1, CG ≈ G2, MI ≈ F1), puis est ajoutée aux `series_recommandees` des formations où
cette série proche figure (bac professionnel : BTS, DUT, techniciens et licences seulement). Script idempotent.
"""
import json
from pathlib import Path

REF = Path(__file__).resolve().parent.parent / "data" / "referentiels"
SOURCE = "Liste officielle des séries, Direction des examens et concours de l'enseignement technique (bactechgabon.com), 21/11/2026"

# code, intitulé officiel, série proche, matières dominantes
TECHNO = [
    ("ACA", "Action et communication administratives", "g1", ["Communication administrative", "Bureautique", "Économie et droit", "Français"]),
    ("ACC", "Action et communication commerciales", "g3", ["Techniques commerciales", "Communication", "Économie et droit", "Langues vivantes"]),
    ("AEC", "Architecture et éco-construction", "f4", ["Dessin d'architecture", "Construction", "Mathématiques", "Sciences physiques"]),
    ("BGB", "Biochimie – génie biologique", "d", ["Biochimie", "Biologie", "Chimie", "Mathématiques"]),
    ("BIOT", "Biotechnologie", "d", ["Biotechnologies", "Biologie", "Chimie", "Mathématiques"]),
    ("CFE", "Comptabilité et finance d'entreprise", "g2", ["Comptabilité", "Finance", "Mathématiques", "Économie et droit"]),
    ("CG", "Comptabilité et gestion", "g2", ["Comptabilité", "Gestion", "Mathématiques", "Économie et droit"]),
    ("CLPI", "Chimie de laboratoire et procédés industriels", "d", ["Chimie", "Procédés industriels", "Sciences physiques", "Mathématiques"]),
    ("ERE", "Énergies renouvelables et environnement", "f3", ["Énergétique", "Électrotechnique", "Sciences physiques", "Mathématiques"]),
    ("F1C", "Génie mécanique, option structures métalliques", "f1", ["Construction mécanique", "Dessin technique", "Mathématiques", "Sciences physiques"]),
    ("F1D", "Génie mécanique, option bois et matériaux associés", "f1", ["Technologie du bois", "Dessin technique", "Mathématiques", "Sciences physiques"]),
    ("GSI", "Gestion des systèmes d'information", "g2", ["Informatique de gestion", "Comptabilité", "Mathématiques", "Économie et droit"]),
    ("M", "Mercatique", "g3", ["Mercatique (marketing)", "Techniques commerciales", "Économie et droit", "Langues vivantes"]),
    ("MI", "Génie mécanique, option maintenance industrielle", "f1", ["Maintenance industrielle", "Mécanique", "Électrotechnique", "Mathématiques"]),
    ("PM", "Productique mécanique", "f1", ["Productique", "Usinage", "Dessin technique", "Mathématiques"]),
    ("RHC", "Ressources humaines et communication", "g1", ["Gestion des ressources humaines", "Communication", "Économie et droit", "Français"]),
    ("SI", "Sciences de l'ingénieur", "e", ["Sciences de l'ingénieur", "Mathématiques", "Sciences physiques", "Technologie"]),
    ("SPCL", "Sciences physiques et chimiques en laboratoire", "d", ["Chimie", "Physique", "Mathématiques", "Biologie"]),
]
PRO = [
    ("CI", "Chaudronnerie industrielle", "f1"), ("CQAA", "Contrôle qualité agroalimentaire", "d"),
    ("DWM", "Développement web, multimédia et mobile", "g2"), ("EI", "Électricité industrielle", "f3"),
    ("III", "Informatique et internet industriel", "f2"), ("ISEC", "Installation des systèmes énergétiques et climatiques", "f3"),
    ("MEH", "Maintenance des équipements hospitaliers", "f2"), ("MEI", "Maintenance des équipements industriels", "f1"),
    ("MENI", "Menuiserie industrielle", "f1"), ("MINF", "Maintenance informatique", "f2"),
    ("MVA", "Maintenance des véhicules automobiles, option voitures particulières", "f1"),
    ("MVAVTR", "Maintenance des véhicules automobiles, option véhicules de transport routier", "f1"),
    ("MVI", "Maintenance des véhicules industriels", "f1"), ("ORGO", "Organisation et réalisation du gros œuvre", "f4"),
    ("PA", "Production animale", "d"), ("PV", "Production végétale", "d"), ("SD", "Scieur dérouleur", "f1"),
    ("TCG", "Techniques comptables et de gestion", "g2"), ("TGA", "Techniques de gestion administrative", "g1"),
]
OFFICIELS = {"f1": "Génie mécanique, option productique", "f2": "Génie électronique", "f3": "Génie électrotechnique", "f4": "Génie civil"}
COURTES = ("frm-bts", "frm-dut", "frm-ts", "frm-licence", "frm-bachelor", "frm-deust", "frm-dts")


def main():
    sp, fp = REF / "series.json", REF / "formations.json"
    S, Fo = json.loads(sp.read_text()), json.loads(fp.read_text())
    par_id = {s["id"]: s for s in S["items"]}
    for k, v in OFFICIELS.items():
        par_id[f"ga-bac-{k}"]["intitule"] = v
    for k in ("g1", "g2", "g3"):
        par_id[f"ga-bac-{k}"]["remarque"] = "Ancienne appellation des séries tertiaires, remplacée par ACA, ACC, CG, CFE, GSI, M et RHC : garde-la si c'est celle de ton diplôme."
    ajouts = []
    for code, intitule, proche, matieres in TECHNO:
        ajouts.append((code, intitule, proche, matieres, "technique", None))
    for code, intitule, proche in PRO:
        ajouts.append((code, intitule, proche, par_id[f"ga-bac-{proche}"]["matieres_dominantes"], "professionnelle",
                       "Bac professionnel : accès d'abord aux BTS, DUT, formations de technicien et licences de la même spécialité."))
    proches = {}
    for code, intitule, proche, matieres, filiere, remarque in ajouts:
        sid = f"ga-bac-{code.lower()}"
        ref = par_id[f"ga-bac-{proche}"]
        fa = [f for f in ref["formations_accessibles"] if filiere != "professionnelle" or f.startswith(COURTES)]
        item = {**{k: v for k, v in ref.items() if k not in ("source",)}, "id": sid, "pays": "GA", "code": code, "intitule": intitule, "filiere": filiere,
                "matieres_dominantes": matieres, "remarque": remarque, "formations_accessibles": fa, "source": SOURCE}
        if sid in par_id: par_id[sid].update(item)
        else: S["items"].append(item); par_id[sid] = item
        proches[sid] = (f"ga-bac-{proche}", filiere)
    # Ordre : générales, techniques, professionnelles du Gabon, puis les autres pays inchangés
    ga = [s for s in S["items"] if s["pays"] == "GA"]
    rang = {"générale": 0, "technique": 1, "professionnelle": 2}
    ga.sort(key=lambda s: (rang.get(s["filiere"], 3), [x["id"] for x in S["items"]].index(s["id"]) if s["filiere"] == "générale" else s["code"]))
    S["items"] = ga + [s for s in S["items"] if s["pays"] != "GA"]
    S["_meta"].setdefault("orientation_fin_college", {}).setdefault("GA", {})["voies"] = [
        "2nde générale littéraire (→ A1, A2)", "2nde générale scientifique (→ C, D)", "2nde économique (→ B)",
        "2nde technique industrielle (→ E, F1, F1C, F1D, F2, F3, F4, MI, PM, SI, AEC, ERE)",
        "2nde technique tertiaire (→ ACA, ACC, CG, CFE, GSI, M, RHC ; anciennement G1-G3)",
        "2nde technique de laboratoire (→ SPCL, CLPI, BGB, BIOT)", "Bac professionnel (CI, DWM, EI, MINF, MVA, ORGO, PA, PV, TCG, TGA…)",
        "Formation professionnelle (CAP, BEP, BT)"]
    n = 0
    for f in Fo["items"]:
        ga_s = f.get("series_recommandees", {}).get("GA")
        if not ga_s: continue
        for sid, (proche, filiere) in proches.items():
            if proche in ga_s and sid not in ga_s and (filiere != "professionnelle" or f["id"].startswith(COURTES)):
                ga_s.append(sid); n += 1
    sp.write_text(json.dumps(S, ensure_ascii=False, indent=2) + "\n")
    fp.write_text(json.dumps(Fo, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(ajouts)} séries gabonaises ajoutées ou mises à jour, {n} recommandations ajoutées aux formations")


if __name__ == "__main__":
    main()
